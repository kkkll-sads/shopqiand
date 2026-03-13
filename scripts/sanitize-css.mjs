import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

const isUnsafeColorSupports = (params = '') =>
  /color\s*:\s*lab\(/i.test(params) || /color\s*:\s*color-mix\(/i.test(params);
const tailwindSpecificityHackRe = /:not\(#\\#\)/g;
const tailwindSpecificityHackNeedle = ':not(#\\#)';

let changedFiles = 0;
let totalBytesBefore = 0;
let totalBytesAfter = 0;

for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  const sizeBefore = statSync(file).size;
  totalBytesBefore += sizeBefore;

  const root = postcss.parse(source);
  let changed = false;

  root.walkAtRules('supports', (atRule) => {
    if (isUnsafeColorSupports(atRule.params)) {
      atRule.remove();
      changed = true;
    }
  });

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

  const viaStopsRe = /var\(\s*--tw-gradient-via-stops\s*,\s*/;

  const flattenViaStopsWrapper = (value) => {
    const match = value.match(viaStopsRe);
    if (!match || match.index == null) {
      return null;
    }

    const startIdx = match.index + match[0].length;
    let depth = 1;
    let endIdx = startIdx;

    for (let index = startIdx; index < value.length; index += 1) {
      if (value[index] === '(') {
        depth += 1;
      }
      if (value[index] === ')') {
        depth -= 1;
      }
      if (depth === 0) {
        endIdx = index;
        break;
      }
    }

    return value.substring(startIdx, endIdx).trim();
  };

  root.walkDecls(/^--tw-gradient-(stops|via-stops)$/, (decl) => {
    const flattened = flattenViaStopsWrapper(decl.value);
    if (flattened) {
      decl.value = flattened;
      changed = true;
    }
  });

  if (changed) {
    writeFileSync(file, root.toString(), 'utf8');
    changedFiles += 1;
  }

  totalBytesAfter += statSync(file).size;
}

console.log(
  `[sanitize-css] Processed ${cssFiles.length} file(s) in ${targetDirArg}. ` +
    `Changed ${changedFiles} file(s). Size: ${totalBytesBefore} -> ${totalBytesAfter} bytes.`,
);
