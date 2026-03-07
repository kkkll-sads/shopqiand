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

const isUnsafeColorSupports = (params = '') => (
  /color\s*:\s*lab\(/i.test(params) || /color\s*:\s*color-mix\(/i.test(params)
);

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
    if (!rule.selector) return;
    if (rule.selector.includes(':host')) {
      rule.remove();
      changed = true;
    }
  });

  // 展平 Tailwind v4 渐变变量链，修复低版本 Android WebView 渐变不渲染
  // Tailwind v4: --tw-gradient-stops: var(--tw-gradient-via-stops, var(...), ...)
  // 旧 WebView 无法解析多层嵌套 var()，去除 var(--tw-gradient-via-stops, ...) 外壳
  const viaStopsRe = /var\(\s*--tw-gradient-via-stops\s*,\s*/;

  const flattenViaStopsWrapper = (value) => {
    const match = value.match(viaStopsRe);
    if (!match) return null;

    const startIdx = match.index + match[0].length;
    let depth = 1;
    let endIdx = startIdx;
    for (let i = startIdx; i < value.length; i++) {
      if (value[i] === '(') depth++;
      if (value[i] === ')') depth--;
      if (depth === 0) {
        endIdx = i;
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
    const output = root.toString();
    writeFileSync(file, output, 'utf8');
    changedFiles += 1;
  }

  totalBytesAfter += statSync(file).size;
}

console.log(
  `[sanitize-css] Processed ${cssFiles.length} file(s) in ${targetDirArg}. ` +
  `Changed ${changedFiles} file(s). Size: ${totalBytesBefore} -> ${totalBytesAfter} bytes.`
);
