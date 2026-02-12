# Shopqiand Optimization Plan

## Scope
This document tracks project-wide optimization work for branch `0114`, including:
- runtime compatibility (legacy Android / WebView)
- bundle size and load performance
- engineering quality gates and regression prevention

## Related Docs
- `/Users/a0000/shopqiand/docs/页面级硬编码配置后端化清单.md`
- `/Users/a0000/shopqiand/docs/测试后可删除冗余代码与回归清单.md`

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

## Current Snapshot (2026-02-12)
- Validation: `npm run verify` passes
- CSS compatibility guard: passing (`193889 bytes`, budget `200000`)
- Source files: `499` TS/TSX files (after modularization split)
- Critical-path `any` count (auth/wallet/market/hooks/services scope): `176` (from `236`, `-60`)

## Optimization Batches

### Batch A: Build & Compatibility Hardening (Done)
- [x] Add post-build CSS sanitization (`lab/color-mix/:host/@property` strip)
- [x] Add CSS compatibility guard script
- [x] Add CI workflow (`test + typecheck + build + css-compat`)
- [x] Add unified verify command

Acceptance:
- `npm run verify` must pass
- Dist CSS contains no legacy-unsafe constructs

### Batch B: Size & Performance Guardrails (Done)
- [x] Narrow Tailwind content scanning to project source only
- [x] Add CSS size budget guard in compatibility check
- [x] Disable legacy plugin modern polyfills to reduce modern-bundle payload
- [x] Rebuild and record before/after size deltas

Acceptance:
- CSS bundle size is reduced or stable under budget
- No regression in `test/typecheck/build/compat`

### Batch C: Hotspot Refactor (In progress)
- [x] Split hotspot page/component files into domain modules (ongoing in batches)
- [x] Isolate API contracts/types from service logic (core auth/shop-order/wallet-recharge completed)
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

## Batch C Module Cleanup Checklist (Next Pass)
### Services
- [ ] `src/services/common.ts` (`9 any`, `283 lines`)
- [ ] `src/services/user/profile.ts` (`8 any`, `264 lines`)
- [ ] `src/services/networking.ts` (`6 any`, `148 lines`)
- [ ] `src/services/consignment-modules/market.ts` (`6 any`, `249 lines`)
- [ ] `src/services/wallet/logs.ts` (`5 any`, `180 lines`)
- [ ] `src/services/client.ts` (`5 any`, `173 lines`)
- [ ] `src/services/cms.ts` (`5 any`, `270 lines`)
Action focus:
1. Replace `Record<string, any>` and `catch (error: any)` with typed contracts/`unknown`.
2. Add narrow response interfaces for list/detail payloads currently using dynamic maps.
3. Keep old exports stable through facade files when splitting internals.

### Wallet
- [ ] `src/pages/wallet/hooks/useClaimUnlock.ts` (`5 any`, `166 lines`)
- [ ] `src/pages/wallet/MyCollectionDetail.tsx` (`4 any`, `301 lines`)
- [ ] `src/pages/wallet/hooks/use-consignment-action/actions.ts` (`3 any`, `318 lines`)
- [ ] `src/pages/wallet/my-collection-detail/ConsignmentModal.tsx` (`3 any`, `299 lines`)
- [ ] `src/pages/wallet/CardManagement.tsx` (`3 any`, `405 lines`)
Action focus:
1. Extract modal/form payload types into nearby `types.ts`.
2. Convert submit/side-effect branches to typed action handlers.
3. Split `CardManagement.tsx` by hook + presentational sections before further logic edits.

### Market
- [ ] `src/pages/market/OrderListPage.tsx` (`3 any`, `262 lines`)
- [ ] `src/pages/market/MatchingPoolPage.tsx` (`2 any`, `348 lines`)
- [ ] `src/pages/market/hooks/useProductBuy.ts` (`2 any`, `209 lines`)
- [ ] `src/pages/market/submit-review/hooks/reviewUploads.ts` (`2 any`, `153 lines`)
Action focus:
1. Unify order/pool item contracts with `src/services/contracts/*`.
2. Remove fallback `any` in map/reducer helpers by adding guard functions.
3. Keep page files focused on composition; move side effects to hooks.

### Shared Hooks
- [ ] `src/hooks/useAssetTabs.ts` (`10 any`, `282 lines`)
- [ ] `src/hooks/useStateMachine.ts` (`3 any`, `264 lines`)
- [ ] `src/hooks/useErrorHandler.ts` (`3 any`, `274 lines`)
- [ ] `src/hooks/asset-action-modal/actions.ts` (`3 any`, `208 lines`)
Action focus:
1. Promote reusable generic types (`StateMachine`, `ErrorPayload`, tab configs).
2. Replace broad exception typing with `unknown` + central extractor.
3. Align hook return types for predictable downstream inference.

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
- 2026-02-10: Added regression-gated cleanup document.
  - New cleanup/testing gate doc: `/Users/a0000/shopqiand/docs/测试后可删除冗余代码与回归清单.md`.
  - Classified removable compatibility code by risk and required regression routes.
  - Explicitly marked backdrop/color compatibility code as "keep for now" due low-end device rendering anomalies.
- 2026-02-10: Continued Batch C large-file split.
  - `/Users/a0000/shopqiand/src/pages/wallet/hooks/useConsignmentAction.ts` split into `helpers/data/actions` modules.
  - `/Users/a0000/shopqiand/src/services/consignment.ts` split into `consignment-modules` sub-services and kept as export facade.
  - Validation: `npm run typecheck`, `npm run test`, `npm run build` passed.
- 2026-02-10: Continued Batch C constants modularization.
  - `/Users/a0000/shopqiand/src/constants/statusEnums.ts` split into domain modules under `/Users/a0000/shopqiand/src/constants/status-enums/`.
  - Kept `/Users/a0000/shopqiand/src/constants/statusEnums.ts` as compatibility export facade.
  - Validation: `npm run typecheck`, `npm run test`, `npm run build` passed.
- 2026-02-10: Continued Batch C service modularization.
  - `/Users/a0000/shopqiand/src/services/collection/trade.ts` split into `/Users/a0000/shopqiand/src/services/collection/trade-modules/` (`item`, `matching`, `reservation`).
  - Kept `/Users/a0000/shopqiand/src/services/collection/trade.ts` as compatibility export facade.
  - Validation: `npm run typecheck`, `npm run test`, `npm run build` passed.
- 2026-02-10: Continued Batch C page modularization.
  - `/Users/a0000/shopqiand/src/pages/market/ShopProductDetail.tsx` split into `/Users/a0000/shopqiand/src/pages/market/shop-product-detail/` (`components`, `hooks`, `utils`).
  - Validation: `npm run typecheck`, `npm run test`, `npm run build` passed.
- 2026-02-10: Continued Batch C wallet page modularization.
  - `/Users/a0000/shopqiand/src/pages/wallet/CumulativeRights.tsx` split into `/Users/a0000/shopqiand/src/pages/wallet/cumulative-rights/` (`components`, `hooks`, `helpers`, `types`).
  - Page file reduced from `440` lines to `58` lines, with behavior unchanged.
  - Validation: `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:css-compat` passed.
- 2026-02-10: Continued Batch C review page modularization.
  - `/Users/a0000/shopqiand/src/pages/market/SubmitReview.tsx` split with `useSubmitReviewForm` and `constants` under `/Users/a0000/shopqiand/src/pages/market/submit-review/`.
  - Page file reduced from `433` lines to `150` lines, with upload/提交流程保持不变。
  - Validation: `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:css-compat` passed.
- 2026-02-10: Continued Batch C password form modularization.
  - `/Users/a0000/shopqiand/src/components/business/PasswordForm.tsx` split into `/Users/a0000/shopqiand/src/components/business/password-form/` (`types`, `config`, `hooks`, `components`).
  - Page file reduced from `442` lines to `203` lines, with表单流程与提示交互保持不变。
  - Validation: `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:css-compat` passed.
- 2026-02-12: Continued Batch C auth/cms/hook modularization wrap-up.
  - `/Users/a0000/shopqiand/src/hooks/useAssetActionModal.ts` completed split with submit flows moved to `/Users/a0000/shopqiand/src/hooks/asset-action-modal/actions.ts` (state orchestration kept in hook).
  - `/Users/a0000/shopqiand/src/hooks/useRealNameAuth.ts` completed type extraction by moving hook return contract to `/Users/a0000/shopqiand/src/hooks/real-name-auth/types.ts`.
  - `/Users/a0000/shopqiand/src/pages/auth/Login.tsx` completed split with business logic moved to `/Users/a0000/shopqiand/src/pages/auth/login/hooks/useLoginPage.ts` (page reduced `274 -> 81`).
  - `/Users/a0000/shopqiand/src/pages/cms/Home.tsx` completed split with data/timer/touch logic moved to `/Users/a0000/shopqiand/src/pages/cms/home/hooks/useHomeContent.ts` (page reduced `318 -> 135`).
  - `/Users/a0000/shopqiand/src/pages/cms/SignIn.tsx` completed split with sign-in lifecycle logic moved to `/Users/a0000/shopqiand/src/pages/cms/sign-in/hooks/useSignInPage.ts` (page reduced `297 -> 96`).
  - Fixed in-progress wallet entry export chain by adding `/Users/a0000/shopqiand/src/pages/wallet/asset-view/index.tsx` to satisfy `/Users/a0000/shopqiand/src/pages/wallet/AssetView.tsx` re-export.
  - Fixed readonly option type mismatch in `/Users/a0000/shopqiand/src/pages/wallet/hooks/useAssetHistoryData.ts` to unblock project-level typecheck.
  - Validation: `npm run typecheck`, `npm run test`, `npm run build`, `npm run check:css-compat` passed.
- 2026-02-12: Continued Batch C remaining items (contracts isolation + any reduction).
  - Isolated API contracts from service logic by introducing `/Users/a0000/shopqiand/src/services/contracts/` and migrating core auth/market/wallet contracts:
    `/Users/a0000/shopqiand/src/services/contracts/auth.ts`,
    `/Users/a0000/shopqiand/src/services/contracts/shop-order.ts`,
    `/Users/a0000/shopqiand/src/services/contracts/wallet-recharge.ts`.
  - Updated service facades to re-export migrated contracts while keeping external imports stable:
    `/Users/a0000/shopqiand/src/services/auth.ts`,
    `/Users/a0000/shopqiand/src/services/shop/order.ts`,
    `/Users/a0000/shopqiand/src/services/wallet/recharge.ts`.
  - Reduced `any` usage in critical auth/market/wallet paths:
    `/Users/a0000/shopqiand/src/services/auth.ts`,
    `/Users/a0000/shopqiand/src/pages/market/hooks/useOrderList.ts`,
    `/Users/a0000/shopqiand/src/pages/wallet/hooks/useCollectionData.ts`.
  - Validation: `npm run typecheck` passed.
- 2026-02-12: Synced full-check results and advanced Batch C `any` reduction (critical paths).
  - Notification UX style optimization completed for global system:
    - `/Users/a0000/shopqiand/src/styles/notifications.css`
    - `/Users/a0000/shopqiand/src/components/common/NotificationComponents.tsx`
  - Replaced key `catch (error: any)` with `unknown` + typed extraction/guards in auth/wallet/market flows:
    - `/Users/a0000/shopqiand/src/services/auth.ts`
    - `/Users/a0000/shopqiand/src/pages/auth/login/hooks/useLoginPage.ts`
    - `/Users/a0000/shopqiand/src/pages/auth/Register.tsx`
    - `/Users/a0000/shopqiand/src/pages/wallet/BalanceWithdraw.tsx`
    - `/Users/a0000/shopqiand/src/pages/wallet/HashrateExchange.tsx`
    - `/Users/a0000/shopqiand/src/pages/market/ReviewsPage.tsx`
    - `/Users/a0000/shopqiand/src/pages/market/SearchPage.tsx`
    - `/Users/a0000/shopqiand/src/hooks/real-name-auth/flows.ts`
    - `/Users/a0000/shopqiand/src/hooks/useAssetActionModal.ts`
  - Scope metric update: critical-path `any` count `254 -> 236` (`-18`).
  - Validation: `npm run verify` passed (`test + typecheck + build + css-compat`).
- 2026-02-12: Continued Batch C remaining cleanup (market hooks + module checklist).
  - Removed explicit `any` usage from market hooks:
    `/Users/a0000/shopqiand/src/pages/market/hooks/useProductDetail.ts`,
    `/Users/a0000/shopqiand/src/pages/market/hooks/useOrderActions.ts`.
  - `useProductDetail` now uses typed numeric/spec fallback helpers (no `as any` for `sales_count/spec.value`).
  - `useOrderActions` catch branches now use `unknown` with `extractErrorFromException`.
  - Added module-based cleanup checklist to guide next pass across `services/wallet/market/hooks`.
  - Scope metric update: critical-path `any` count `236 -> 176` (`-60`, same scope).
  - Validation: `npm run typecheck` passed.
