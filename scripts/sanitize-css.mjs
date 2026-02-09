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
