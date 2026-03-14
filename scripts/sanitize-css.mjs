import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import postcss from 'postcss';

const targetDirArg = process.argv[2] || 'dist/assets';
const targetDir = join(process.cwd(), targetDirArg);

const cssFiles = readdirSync(targetDir)
  .filter((name) => name.endsWith('.css'))
  .map((name) => join(targetDir, name));

if (cssFiles.length === 0) {
  console.log(`[sanitize-css] No CSS files found in ${targetDirArg}, skip.`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// oklch() → hex conversion (OKLab color space math)
// ---------------------------------------------------------------------------
function oklchToHex(lPct, c, hDeg) {
  const l = lPct / 100;
  const hRad = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  const rLin = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const gLin = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bLin = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;

  const gamma = (v) =>
    v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  const clamp = (v) => Math.round(Math.max(0, Math.min(1, gamma(v))) * 255);

  const r = clamp(rLin);
  const g = clamp(gLin);
  const bl = clamp(bLin);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

const oklchRe = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/g;

function replaceOklch(value) {
  return value.replace(oklchRe, (_match, lStr, cStr, hStr) => {
    try {
      return oklchToHex(parseFloat(lStr), parseFloat(cStr), parseFloat(hStr));
    } catch {
      return _match;
    }
  });
}

// ---------------------------------------------------------------------------
// Strip "in oklab" / "in oklch" from gradient interpolation
// ---------------------------------------------------------------------------
const inColorSpaceRe = /\s+in\s+ok(?:lab|lch)\b/gi;

function stripGradientColorSpace(value) {
  return value.replace(inColorSpaceRe, '');
}

// ---------------------------------------------------------------------------
// Existing helpers
// ---------------------------------------------------------------------------
const isUnsafeColorSupports = (params = '') => {
  if (/color\s*:\s*lab\(/i.test(params)) return true;
  if (/color\s*:\s*color-mix\(/i.test(params)) return true;
  // Match `@supports (color: rgb(from ...))` but NOT the Tailwind properties
  // fallback which uses `not (color:rgb(from ...))` — that block provides
  // essential initial values for custom properties on older browsers.
  if (/color\s*:\s*rgb\(\s*from\b/i.test(params) && !/not\s*\(\s*color\s*:\s*rgb\(\s*from\b/i.test(params)) {
    return true;
  }
  return false;
};
const tailwindSpecificityHackRe = /:not\(#\\#\)/g;
const tailwindSpecificityHackNeedle = ':not(#\\#)';

let changedFiles = 0;
let totalBytesBefore = 0;
let totalBytesAfter = 0;
const renamedFiles = [];

for (let file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  const sizeBefore = statSync(file).size;
  totalBytesBefore += sizeBefore;

  const root = postcss.parse(source);
  let changed = false;

  // Unwrap @layer blocks — browsers without @layer support (Chrome < 99)
  // would silently ignore ALL content inside, breaking the entire stylesheet.
  // Preserves rule order so the natural cascade still works.
  root.walkAtRules('layer', (atRule) => {
    if (atRule.nodes && atRule.nodes.length > 0) {
      atRule.replaceWith(atRule.nodes);
    } else {
      atRule.remove();
    }
    changed = true;
  });

  // Handle @supports blocks:
  // 1. Remove blocks with unsafe color functions (color-mix, lab, rgb(from))
  // 2. Unwrap the Tailwind custom-property init block (detected by
  //    -webkit-hyphens / -moz-orient) so the defaults always apply —
  //    we removed @property, so this fallback is the ONLY init path.
  root.walkAtRules('supports', (atRule) => {
    if (isUnsafeColorSupports(atRule.params)) {
      atRule.remove();
      changed = true;
    } else if (/webkit-hyphens|moz-orient/i.test(atRule.params)) {
      if (atRule.nodes && atRule.nodes.length > 0) {
        atRule.replaceWith(atRule.nodes);
      } else {
        atRule.remove();
      }
      changed = true;
    }
  });

  // Remove @property at-rules
  root.walkAtRules('property', (atRule) => {
    atRule.remove();
    changed = true;
  });

  root.walkRules((rule) => {
    if (!rule.selector) {
      return;
    }

    if (rule.selector.includes(':host')) {
      const nextSelectors = rule.selector
        .split(',')
        .map((selector) => selector.trim())
        .filter((selector) => selector !== ':host');

      if (nextSelectors.length === 0) {
        rule.remove();
      } else {
        rule.selector = nextSelectors.join(',');
      }
      changed = true;
    }

    if (rule.selector.includes(tailwindSpecificityHackNeedle)) {
      rule.selector = rule.selector.replace(tailwindSpecificityHackRe, '');
      changed = true;
    }
  });

  // Replace oklch() with hex and strip "in oklab" from all declarations
  root.walkDecls((decl) => {
    const original = decl.value;
    let next = original;

    if (oklchRe.test(next)) {
      oklchRe.lastIndex = 0;
      next = replaceOklch(next);
    }

    if (inColorSpaceRe.test(next)) {
      inColorSpaceRe.lastIndex = 0;
      next = stripGradientColorSpace(next);
    }

    if (next !== original) {
      decl.value = next;
      changed = true;
    }
  });

  if (changed) {
    const output = root.toString();
    writeFileSync(file, output, 'utf8');
    changedFiles += 1;

    // Rehash the CSS file and rename so browsers don't serve stale cache
    const hash = createHash('md5').update(output).digest('hex').slice(0, 8);
    const oldName = basename(file);
    const newName = oldName.replace(/^(.*)-[\w]+\.css$/, `$1-${hash}.css`);

    if (newName !== oldName) {
      const newPath = join(targetDir, newName);
      renameSync(file, newPath);

      // Update references in dist HTML files
      const distDir = join(targetDir, '..');
      const htmlFiles = readdirSync(distDir)
        .filter((n) => n.endsWith('.html'))
        .map((n) => join(distDir, n));

      for (const htmlFile of htmlFiles) {
        const html = readFileSync(htmlFile, 'utf8');
        if (html.includes(oldName)) {
          writeFileSync(htmlFile, html.replaceAll(oldName, newName), 'utf8');
        }
      }

      renamedFiles.push({ from: oldName, to: newName });
      file = newPath;
    }
  }

  totalBytesAfter += statSync(file).size;
}

console.log(
  `[sanitize-css] Processed ${cssFiles.length} file(s) in ${targetDirArg}. ` +
    `Changed ${changedFiles} file(s). Size: ${totalBytesBefore} -> ${totalBytesAfter} bytes.`,
);

if (renamedFiles.length > 0) {
  renamedFiles.forEach(({ from, to }) =>
    console.log(`[sanitize-css] Renamed ${from} -> ${to}`),
  );
}
