import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distAssetsDir = join(process.cwd(), 'dist', 'assets');
const MAX_TOTAL_CSS_BYTES = 200_000;

const checks = [
  {
    name: 'LAB_SUPPORTS_BLOCK',
    pattern: /@supports\s*\(\s*color\s*:\s*lab\(/i,
    message: 'Found @supports(color:lab(...)) block; may trigger color mismatch on legacy WebView.',
  },
  {
    name: 'COLOR_MIX_SUPPORTS_BLOCK',
    pattern: /@supports\s*\(\s*color\s*:\s*color-mix\(/i,
    message: 'Found @supports(color:color-mix(...)) block; may trigger incompatible color overrides.',
  },
  {
    name: 'SHADOW_HOST_SELECTOR',
    pattern: /:host\b/i,
    message: 'Found :host selector in bundle CSS; unnecessary for non-Shadow DOM app and increases CSS size.',
  },
  {
    name: 'CSS_PROPERTY_AT_RULE',
    pattern: /@property\s+--/i,
    message: 'Found @property at-rule in bundle CSS; can break/slow parsing on older Android WebView.',
  },
];

const cssFiles = readdirSync(distAssetsDir)
  .filter((name) => name.endsWith('.css'))
  .map((name) => join(distAssetsDir, name));

if (cssFiles.length === 0) {
  console.error('[check:css-compat] No CSS bundle found under dist/assets. Please run build first.');
  process.exit(1);
}

const findings = [];

for (const file of cssFiles) {
  const content = readFileSync(file, 'utf8');
  for (const check of checks) {
    if (check.pattern.test(content)) {
      findings.push({ file, ...check });
    }
  }
}

if (findings.length > 0) {
  console.error('[check:css-compat] Compatibility check failed:');
  for (const finding of findings) {
    console.error(`- ${finding.name} in ${finding.file}`);
    console.error(`  ${finding.message}`);
  }
  process.exit(1);
}

let totalSize = 0;
for (const file of cssFiles) {
  totalSize += statSync(file).size;
}

if (totalSize > MAX_TOTAL_CSS_BYTES) {
  console.error(
    `[check:css-compat] CSS size budget exceeded: ${totalSize} bytes > ${MAX_TOTAL_CSS_BYTES} bytes.`
  );
  process.exit(1);
}

console.log(`[check:css-compat] Passed. CSS bundles: ${cssFiles.length}, total size: ${totalSize} bytes.`);
