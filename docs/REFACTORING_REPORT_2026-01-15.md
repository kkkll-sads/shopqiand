## 重构说明（2026-01-15）

### 目标
- 统一导航体系，逐步移除旧 `Route/onNavigate` 依赖
- 登录后补齐实名认证状态获取
- 规范认证状态存储与页面访问守卫

### 已完成
- Home、消息中心、订单相关页面改为 `useNavigate`
  - `pages/cms/Home.tsx`
  - `pages/cms/MessageCenter.tsx`
  - `pages/market/OrderListPage.tsx`
  - `pages/market/OrderDetail.tsx`
  - `pages/market/Cashier.tsx`
  - `pages/market/CollectionOrderDetail.tsx`
- Wrapper 简化为直接渲染页面
  - `src/pages/HomeEntryWrapper.tsx`
  - `src/pages/market/OrderListPageWrapper.tsx`
  - `src/pages/market/OrderDetailWrapper.tsx`
  - `src/pages/market/CashierWrapper.tsx`
  - `src/pages/cms/MessageCenterWrapper.tsx`
- 新增/补齐路由
  - `/recharge-order/:orderId`
  - `/withdraw-order/:orderId`
  - `/collection-order` 与 `/collection-order/:id`
- 登录后单独调用实名认证状态接口
  - `pages/auth/Login.tsx` 调用 `fetchRealNameStatus`
  - `authStore` 中更新 `realNameStatus/realName`

### 进行中
- 市场与预约相关页面导航统一（`TradingZone`/`Reservation*`/`ProductDetail`/`PointsProductDetail`）
- 旧 `router/routes.ts` 的 `Route` 类型替换与清理
- `withNavigation` HOC 的收敛与逐步移除

### 待处理风险
- `/search` 路由未在 `src/router/index.tsx` 注册（首页搜索入口需要确认目标路径）
- 余额充值/提现详情页路由完善后，需要统一消息中心跳转
- 实名态状态来源需统一（登录、刷新、实名提交后回写）

### 后续任务建议
1) 完成交易/预约相关页面导航内聚（移除 `onNavigate`）
2) 清理 `withNavigation` 与旧 `Route` 类型引用
3) 补齐 `/search` 路由或替换搜索入口路径
4) 统一实名认证状态更新入口（登录/页面初始化/实名提交后）
