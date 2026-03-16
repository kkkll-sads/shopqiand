# Project Agent Rules

## Global Encoding Rule

- All new or modified text files must use `UTF-8` without BOM.
- Do not mix encodings such as `GBK`, `ANSI`, or `UTF-16`.
- Line endings: prefer `LF`; if a target file already uses `CRLF`, keep `CRLF` to avoid unrelated diffs.
- When writing files in PowerShell, explicitly use UTF-8 without BOM.
- Before commit, verify changed files do not introduce mojibake, BOM, or mixed encodings.

## Legacy WebView Compatibility (Highest Priority)

- Target compatibility baseline: Android >= 5, iOS >= 10.
- Do not introduce unsupported CSS runtime features such as:
  - `color-mix()`, `lab()`, `oklch()`, `@property`, `:host`, `lh` unit.
- Do not introduce unsupported JS runtime features such as:
  - `Array.at()`, `Object.hasOwn()`, `structuredClone()`,
    `Array.prototype.findLast()`, `String.prototype.replaceAll()`,
    top-level `await`, `??=`, `||=`, `&&=`.
- `@vitejs/plugin-legacy` handles syntax transforms, but do not assume instance-method polyfills.
- After frontend changes, run `npm run build` and keep CSS compatibility checks passing.

## Current Repository Baseline

- Router is currently `react-router-dom@6.x` (not 7).
- Zustand / Vitest / ESLint + Prettier are not yet enabled in this repo.
- Follow current scripts in `package.json` as the source of truth.
