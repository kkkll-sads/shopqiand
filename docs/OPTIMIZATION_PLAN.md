# Shopqiand Optimization Plan

## Scope
This document tracks project-wide optimization work for branch `0114`, including:
- runtime compatibility (legacy Android / WebView)
- bundle size and load performance
- engineering quality gates and regression prevention

## Baseline (before this batch)
- Validation: `npm run verify` passes
- CSS compatibility guard: enabled and passing
- Main CSS bundle size (post-sanitize): `190693 bytes`
- Source files: `246` TS/TSX files
- Largest files include:
  - `src/services/user.ts` (996 lines)
  - `src/services/collection.ts` (978 lines)
  - `src/services/shop.ts` (780 lines)
  - `src/pages/cms/MessageCenter.tsx` (778 lines)
  - `src/pages/wallet/AssetView.tsx` (753 lines)

## Optimization Batches

### Batch A: Build & Compatibility Hardening (Done)
- [x] Add post-build CSS sanitization (`lab/color-mix/:host/@property` strip)
- [x] Add CSS compatibility guard script
- [x] Add CI workflow (`test + typecheck + build + css-compat`)
- [x] Add unified verify command

Acceptance:
- `npm run verify` must pass
- Dist CSS contains no legacy-unsafe constructs

### Batch B: Size & Performance Guardrails (In progress)
- [x] Narrow Tailwind content scanning to project source only
- [x] Add CSS size budget guard in compatibility check
- [x] Disable legacy plugin modern polyfills to reduce modern-bundle payload
- [x] Rebuild and record before/after size deltas

Acceptance:
- CSS bundle size is reduced or stable under budget
- No regression in `test/typecheck/build/compat`

### Batch C: Hotspot Refactor (Planned)
- [ ] Split oversized files (>700 lines) by domain modules
- [ ] Isolate API contracts/types from service logic
- [ ] Reduce `any` usage in critical paths (auth, wallet, market)

Acceptance:
- each target file reduced below 500 lines where practical
- no behavior regressions in smoke paths

### Batch D: UX Runtime Perf (Planned)
- [ ] Reduce first-screen payload and non-critical synchronous work
- [ ] Add route-level loading budgets and monitor points
- [ ] Validate low-end Android visual stability

Acceptance:
- lower initial payload and smoother page interactions

## Regression Commands
Run in order:
1. `npm run test`
2. `npm run typecheck`
3. `npm run build`
4. `npm run check:css-compat`
5. `npm run verify`

## Change Log
- 2026-02-09: Created optimization plan and started Batch B.
- 2026-02-09: Batch B executed.
  - Tailwind scan scope changed to `./src/**/*` + `./index.html`.
  - CSS budget guard added (`MAX_TOTAL_CSS_BYTES=200000`).
  - `vite` legacy plugin `modernPolyfills` disabled.
  - Validation: `npm run verify` passed.
  - Result: modern polyfills chunk removed from modern output (`polyfills-*.js` non-legacy no longer generated).
  - Current CSS bundle size (post-sanitize): `190693 bytes` (within budget).
