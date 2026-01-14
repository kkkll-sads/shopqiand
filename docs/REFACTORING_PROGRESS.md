# 前端重构进度文档

## 完成日期: 2026-01-14

## 一、已完成任务

### 1. 基础设施升级 ✅

- [x] **ESLint + Prettier 配置**
  - 创建 `eslint.config.js` - ESLint 9 flat config 格式
  - 创建 `.prettierrc` - Prettier 配置
  - 添加 lint 脚本到 package.json

- [x] **CDN 依赖本地化**
  - 移除 Tailwind CDN
  - 移除 importmap（React/Lucide）
  - 本地安装 tailwindcss + postcss + autoprefixer
  - 创建 `tailwind.config.js` 和 `postcss.config.js`
  - 创建 `src/styles/main.css`

### 2. 架构重构 ✅

- [x] **React Router 引入**
  - 安装 `react-router-dom` v6
  - 创建 `src/router/index.tsx` - 路由配置
  - 创建 `src/layouts/MainLayout.tsx` - 主布局
  - 创建 `src/layouts/AuthLayout.tsx` - 认证布局

- [x] **Zustand 状态管理**
  - 安装 `zustand`
  - 创建 `src/stores/authStore.ts` - 认证状态
  - 创建 `src/stores/appStore.ts` - 应用全局状态

- [x] **App.tsx 重构**
  - 原文件: 1009 行
  - 重构后: ~80 行

- [x] **路由懒加载**
  - 所有页面使用 `React.lazy()` + `Suspense`
  - 代码分割生效，独立 chunk 文件

### 3. Logger 优化 ✅

- 生产环境完全禁用 debug/biz 日志
- 保留 warn/error 用于生产错误追踪

## 二、目录结构优化（第四阶段）✅

### 删除的冗余文件/目录

#### 旧入口层

- `pages/entries/` - 整个目录（5个文件）
  - HomeEntry.tsx
  - MarketEntry.tsx
  - ProfileEntry.tsx
  - RightsEntry.tsx
  - OrdersEntry.tsx

#### 过时文档

- `api.md`
- `PROJECT_DOCUMENTATION.md`
- `REFACTORING_LOG.md`
- `metadata.json`
- `docs/state-machines/` - 旧状态机设计文档（3个文件）

#### 未使用的配置

- `config/fieldMapping.json`
- `config/` 目录

#### 未使用的工具

- `utils/fieldMapping.ts`

#### 冗余样式

- `styles/` 目录 → 合并到 `src/styles/`

#### 空文件清理

- `cultural-asset-trader@0.0.0`
- `vite`
- `pnpm-lock.yaml`（使用 npm）

### 目录合并

#### src/services → services

- `apiClient.ts` 移至 `services/`
- 删除 `src/services/` 目录

#### styles 统一

- `styles/notifications.css` → `src/styles/notifications.css`
- 删除根目录 `styles/`

### 包装器优化

主 Tab 包装器现在直接引用实际页面：

- `HomeEntryWrapper.tsx` → `pages/cms/Home.tsx`
- `MarketEntryWrapper.tsx` → `pages/market/Market.tsx`
- `ProfileEntryWrapper.tsx` → `pages/user/Profile.tsx`
- `RightsEntryWrapper.tsx` → `pages/wallet/ClaimStation.tsx`

### Vitest 测试修复

- 添加 `test` 配置到 `vite.config.ts`
- 修复测试脚本（移除 `--runInBand`）
- 更新 `jest.fn()` → `vi.fn()`
- 所有 51 个测试通过

## 三、最终项目结构

```
.
├── components/          # 公共组件
│   ├── business/       # 业务组件
│   ├── common/         # 通用组件
│   └── layout/         # 布局组件
├── constants/          # 常量定义
├── context/            # React Context
├── docs/               # 项目文档
├── hooks/              # 自定义 Hooks
├── pages/              # 页面组件
│   ├── auth/          # 认证页面
│   ├── cms/           # 内容页面
│   ├── live/          # 直播页面
│   ├── market/        # 市场页面
│   ├── user/          # 用户页面
│   └── wallet/        # 钱包页面
├── public/             # 静态资源
├── router/             # 旧路由类型（Route）
├── services/           # API 服务
├── src/                # 重构后的核心代码
│   ├── hooks/         # 新 Hooks
│   ├── layouts/       # 布局组件
│   ├── pages/         # 页面包装器
│   ├── providers/     # Provider 组件
│   ├── router/        # React Router 配置
│   ├── stores/        # Zustand Stores
│   └── styles/        # 样式文件
├── utils/              # 工具函数
├── App.tsx             # 应用入口
├── index.tsx           # React 渲染入口
├── index.html          # HTML 模板
├── vite.config.ts      # Vite 配置
├── tailwind.config.js  # Tailwind 配置
├── tsconfig.json       # TypeScript 配置
├── package.json        # 依赖管理
└── eslint.config.js    # ESLint 配置
```

## 四、项目统计

| 指标     | 数值                      |
| -------- | ------------------------- |
| 源码文件 | 237 个                    |
| CSS 文件 | 2 个                      |
| 目录数   | 45 个                     |
| 项目大小 | ~3MB（不含 node_modules） |
| 构建产物 | 1.7MB                     |
| 测试用例 | 51 个（全部通过）         |

## 五、构建产物分析

```
react-vendor.js    320KB (gzip: 98KB)  - React 核心
area-data.js       193KB (gzip: 52KB)  - 省市区数据
vendor.js           88KB (gzip: 15KB)  - 其他第三方
index.js            47KB (gzip: 15KB)  - 入口代码
页面 chunks      1-43KB each           - 按需加载
```

## 六、命令参考

```bash
# 开发
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format

# 运行测试
npm test
```

## 七、后续建议

### 可选优化

1. 启用 TypeScript 严格模式
2. 添加更多单元测试
3. 集成 Web Vitals 性能监控
4. 逐步移除包装器层，让页面直接使用 hooks

## 八、第五阶段 - 深度优化（2026-01-14）

### 删除的未使用文件

#### Hooks
- `hooks/useRequest.ts` - 0 引用
- `hooks/useUserInfo.ts` - 0 引用
- `hooks/usePagination.ts` - 0 引用

#### 组件
- `components/ProductSpecSheet.tsx` - 0 引用
- `components/common/RealNameRequiredModal.tsx` - 0 引用

#### 常量
- `constants/apiMappings.ts` - 0 引用
- `constants/README.md` - 文档文件

### ESLint 配置优化

- 添加浏览器全局类型（HTMLImageElement 等）
- 添加 Vitest 测试全局变量
- 关闭 `no-console` 规则（由 logger 统一管理）

### 代码修复

- 修复 `ExtensionWithdraw.tsx` 中的变量命名错误
  - `submitErrorMessageMessage` → `submitErrorMessage`
  - `setSubmitError(null)` → `clearSubmitError()`

### Hooks 目录统一

更新 `hooks/index.ts` 重导出新路由 hooks：
- `useAppNavigation`
- `useRouteNavigation`

### 最终统计

| 指标 | 数值 |
|------|------|
| 源码文件 | 231 个 |
| Hooks | 8 个 |
| 组件 | 23 个 |
| 页面 | 85 个 |
| 服务 | 21 个 |
| ESLint 警告 | 255 个（非阻塞）|
| 测试用例 | 51 个（全部通过）|

## 九、第六阶段 - 页面路由迁移（进行中）

### 迁移进度: 14/67 页面

### 已迁移页面（直接使用 usePageNavigation Hook）

#### 认证页面 (3个)
- ✅ ForgotPassword.tsx
- ✅ ResetLoginPassword.tsx
- ✅ ResetPayPassword.tsx

#### CMS页面 (5个)
- ✅ AboutUs.tsx
- ✅ HelpCenter.tsx
- ✅ OnlineService.tsx
- ✅ PrivacyPolicy.tsx
- ✅ UserAgreement.tsx

#### 用户页面 (1个)
- ✅ Settings.tsx

#### 钱包页面 (5个)
- ✅ ClaimDetail.tsx (使用 useParams 获取路由参数)
- ✅ ClaimHistory.tsx
- ✅ ConsignmentVoucher.tsx
- ✅ CumulativeRights.tsx
- ✅ ServiceRecharge.tsx

### 迁移模式

已迁移的页面：
```tsx
// 旧模式
interface PageProps {
  onBack: () => void;
  onNavigate: (route: Route) => void;
}

// 新模式
const Page: React.FC = () => {
  const { goBack, navigateTo } = usePageNavigation();
  // ...
};
```

### 待迁移页面 (53个)

主要包括：
- 市场交易页面 (ProductDetail, OrderList 等)
- 复杂钱包页面 (AssetView, BalanceRecharge 等)
- 用户管理页面 (Profile, AddressList 等)
- 主入口页面 (Home, Market, Rights, Live)

这些页面通常有更复杂的数据依赖，需要逐个分析迁移。

### 迁移进度更新: 36/67 页面

### 新增已迁移页面

#### 用户页面 (新增 6个)
- ✅ InviteFriends.tsx
- ✅ NotificationSettings.tsx
- ✅ UserSurvey.tsx
- ✅ AgentAuth.tsx
- ✅ AddressList.tsx
- ✅ RealNameAuth.tsx
- ✅ AccountDeletion.tsx
- ✅ MyFriends.tsx
- ✅ Profile.tsx

#### 钱包页面 (新增 8个)
- ✅ CardManagement.tsx
- ✅ BalanceWithdraw.tsx
- ✅ BalanceRecharge.tsx
- ✅ ExtensionWithdraw.tsx
- ✅ MyCollection.tsx
- ✅ AssetHistory.tsx
- ✅ HashrateExchange.tsx
- ✅ AssetView.tsx
- ✅ ClaimStation.tsx (Rights entry)

#### 市场页面 (新增 2个)
- ✅ TradingZone.tsx
- ✅ Market.tsx

#### CMS页面 (新增 3个)
- ✅ SignIn.tsx
- ✅ MessageCenter.tsx
- ✅ Home.tsx
- ✅ AnnouncementDetail.tsx

### 待迁移页面 (31个)

主要包括：
- 认证页面 (Login, Register)
- 市场页面 (ProductDetail, OrderListPage, Cashier 等)
- 复杂页面需要特殊处理

### 迁移进度更新: 37+/67 页面

### 新增已迁移页面

#### 用户页面 (新增)
- ✅ EditProfile.tsx
- ✅ FriendDetail.tsx

#### 市场页面 (新增)
- ✅ Orders.tsx
- ✅ MatchingPoolPage.tsx

### 迁移统计
- 已迁移约 36+ 页面
- 仍需迁移约 30 个复杂页面
- 主要剩余：认证页面、市场详情页面、订单页面

### 迁移模式已建立

所有已迁移页面遵循统一模式：
1. 导入 `usePageNavigation` Hook
2. 移除 Props 中的 `onBack`, `onNavigate`, `onLogout`
3. 使用 `goBack()`, `navigateTo()`, `onLogout()` 替代
4. 更新对应的 Wrapper 组件
