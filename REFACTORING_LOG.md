# 项目重构日志 (Refactoring Log)

**日期**: 2025-12-06
**主要目标**: 优化项目结构、提升代码可维护性、修复已知 Bug、统一 UI 风格。

## 1. 目录结构优化 (Directory Structure Optimization)

为了解决 `pages` 目录下文件过多、杂乱无章的问题，我们将页面按功能模块进行了拆分和归类：

-   **`pages/auth/`**: 认证相关页面 (Login, Register, ForgotPassword, etc.)
-   **`pages/user/`**: 用户中心相关页面 (Profile, Settings, Address, RealNameAuth, etc.)
-   **`pages/cms/`**: 内容管理相关页面 (Home, News, HelpCenter, AboutUs, etc.)
-   **`pages/market/`**: 市场/商城相关页面 (Market, ProductDetail, TradingZone, etc.)
-   **`pages/wallet/`**: 钱包/资产相关页面 (AssetView, ServiceRecharge, Withdraw, etc.)

## 2. 服务层重构 (Service Layer Refactoring)

原有的 `services/api.ts` 单文件过大，职责不清。我们将其拆分为多个模块化的服务文件：

-   **`services/auth.ts`**: 登录、注册、密码找回等接口。
-   **`services/user.ts`**: 用户信息、地址管理、实名认证、签到等接口。
-   **`services/wallet.ts`**: 充值、提现、账单明细、支付账户管理等接口。
-   **`services/market.ts`**: 商品列表、商品详情、订单创建等接口。
-   **`services/cms.ts`**: 资讯、公告、帮助中心、轮播图等接口。
-   **`services/networking.ts`**: 核心网络请求封装 (`apiFetch`)。
-   **`services/config.ts`**: API 端点配置管理。
-   **`services/index.ts`**: 统一导出所有服务，保持对外引用兼容性。

## 3. 公共组件抽取 (Component Extraction)

抽取了高频使用的 UI 模式为公共组件，减少重复代码：

-   **`components/common/PageContainer.tsx`**: 统一页面容器，处理标题栏、背景及 SafeArea。
-   **`components/common/LoadingSpinner.tsx`**: 统一加载中状态组件。
-   **`components/common/EmptyState.tsx`**: 统一空状态展示组件。
-   **`components/common/ConfirmModal.tsx` / `ResultModal.tsx`**: 统一确认和结果反馈弹窗。
-   **`components/common/ListItem.tsx`**: 统一列表项样式。

## 4. 关键 Bug 修复 (Critical Bug Fixes)

-   **API 导出缺失**: 修复了 `SignIn.tsx` 中 `doSignIn`, `fetchSignInRules` 等函数未导出的问题。
-   **页面 500 错误**: 修复了 `Home.tsx` 和 `News.tsx` 因导入路径错误导致的渲染崩溃。
-   **路径引用修复**: 全局更新了因文件移动导致的 `import` 路径错误。
-   **UI 适配**: 修复了部分页面在移动端滚动条显示问题，以及 iOS 底部安全区适配。

## 5. UI/UX 改进 (UI/UX Improvements)

-   **统一风格**: 全面应用 Tailwind CSS 进行样式管理，去除内联样式。
-   **交互反馈**: 为所有异步操作添加了 Loading 状态和 Toast 提示。
-   **加载体验**: 图片加载增加骨架屏或占位符 (LazyImage)。
-   **滚动体验**: 优化了长列表的滚动性能，添加下拉刷新 (部分页面)。

## 6. 后续维护建议 (Maintenance Guide)

-   **新增页面**: 请根据功能归类到 `pages` 下的相应子目录。
-   **新增接口**: 请在 `services` 目录下找到对应模块添加，并在 `config.ts` 中配置 URL。
-   **样式修改**: 优先使用 Tailwind Utility Classes，避免写行内样式。
-   **组件复用**: 遇到通用 UI 模式，请优先检查 `components/common` 是否已有现成组件。
