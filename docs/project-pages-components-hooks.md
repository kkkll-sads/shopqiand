# 页面、组件、Hooks 详细说明

## 文档目的

- 对当前前端代码中的页面、组件、hooks 建立统一职责说明，帮助新人快速定位代码与业务映射。
- 通过“路由 -> 页面 -> 组件 -> Hook”链路说明，降低改动时的理解成本和联动风险。
- 本文档基于 `src` 实际代码自动汇总生成，建议在大规模重构后重新生成并校对。

## 页面清单（含路由）

共 80 个页面实现，其中路由挂载页面 77 个，未挂载/保留页面 3 个。

### AboutUsPage

- 文件：`src/pages/AboutUs/index.tsx`
- 路由：`/about`
- 领域：消息、客服与社交
- 导出：`AboutUsPage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`PageHeader`
- 关键 Hooks：`useFeedback`、`useNavigate`、`useNetworkStatus`、`useRequest`
- 数据与接口：`appVersionApi`

### AccumulatedRightsPage

- 文件：`src/pages/AccumulatedRights/index.tsx`
- 路由：`/accumulated-rights`
- 领域：资产与权益管理
- 导出：`AccumulatedRightsPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PullToRefreshContainer`、`Skeleton`、`WalletPageHeader`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useGrouping`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`accountApi`

### ActivityCenterPage

- 文件：`src/pages/ActivityCenter/index.tsx`
- 路由：`/activity-center`
- 领域：通用页面
- 导出：`ActivityCenterPage`
- 页面作用：负责 通用页面 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`activityCenterApi`

### AddressPage

- 文件：`src/pages/Address/index.tsx`
- 路由：`/address`
- 领域：个人中心与设置
- 导出：`AddressPage`
- 页面作用：负责 个人中心与设置 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`RegionPickerSheet`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useRouteScrollRestoration`
- 数据与接口：`addressApi`

### AddReviewPage

- 文件：`src/pages/AddReview/index.tsx`
- 路由：`/order/:orderId/review`、`/product/:id/review/new`
- 领域：订单与交易履约
- 导出：`AddReviewPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`PageHeader`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useParams`、`useSearchParams`
- 数据与接口：`shopOrderApi`、`shopProductApi`、`uploadApi`

### AfterSalesApplyPage

- 文件：`src/pages/AfterSalesApply/index.tsx`
- 路由：`/after-sales/apply/:orderId`
- 领域：订单与交易履约
- 导出：`AfterSalesApplyPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Button`、`Card`、`ErrorState`、`PageHeader`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useParams`
- 数据与接口：`shopOrderApi`、`uploadApi`

### AfterSalesPage

- 文件：`src/pages/AfterSales/index.tsx`
- 路由：`/after-sales`
- 领域：订单与交易履约
- 导出：`AfterSalesPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useRequest`
- 数据与接口：`shopOrderApi`

### AgentAuthPage

- 文件：`src/pages/AgentAuth/index.tsx`
- 路由：`/agent-auth`
- 领域：认证与账号安全
- 导出：`AgentAuthPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Button`、`Card`、`EmptyState`、`ErrorState`、`PageHeader`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`
- 数据与接口：`uploadApi`、`userApi`

### AnnouncementDetailPage

- 文件：`src/pages/AnnouncementDetail/index.tsx`
- 路由：`/announcement/:id`、`/news/:id`
- 领域：消息、客服与社交
- 导出：`AnnouncementDetailPage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useNetworkStatus`、`useParams`、`useRequest`
- 数据与接口：`announcementApi`

### AnnouncementPage

- 文件：`src/pages/Announcement/index.tsx`
- 路由：`/announcement`
- 领域：消息、客服与社交
- 导出：`AnnouncementPage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`announcementApi`

### BillingPage

- 文件：`src/pages/Billing/index.tsx`
- 路由：`/billing`
- 领域：资产与权益管理
- 导出：`BillingPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`OfflineBanner`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useGrouping`、`useInfiniteScroll`、`useLocation`、`useNavigationType`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`、`useSearchParams`、`useSessionState`、`useViewScrollSnapshot`
- 数据与接口：`accountApi`、`rechargeApi`

### CartPage

- 文件：`src/pages/Cart/index.tsx`
- 路由：`/cart`
- 领域：商城与商品浏览
- 导出：`CartPage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useCartCount`、`useFeedback`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`shopCartApi`

### CashierPage

- 文件：`src/pages/Cashier/index.tsx`
- 路由：`/cashier`
- 领域：订单与交易履约
- 导出：`CashierPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Button`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useSearchParams`
- 数据与接口：`rechargeApi`、`shopOrderApi`

### CategoryPage

- 文件：`src/pages/Category/index.tsx`
- 路由：`/category`
- 领域：商城与商品浏览
- 导出：`CategoryPage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`CartCountBadge`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PullToRefreshContainer`、`ShopProductPriceDisplay`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useCartCount`、`useInfiniteScroll`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`shopProductApi`

### ChangePasswordPage

- 文件：`src/pages/ChangePassword/index.tsx`
- 路由：`/change-password`
- 领域：认证与账号安全
- 导出：`ChangePasswordPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`AuthPasswordToggle`、`Button`、`Input`、`PageHeader`、`SettingsActionItem`、`SettingsNotice`、`SettingsSection`
- 关键 Hooks：`useAppNavigate`、`useFeedback`
- 数据与接口：`accountApi`

### ChangePayPasswordPage

- 文件：`src/pages/ChangePayPassword/index.tsx`
- 路由：`/change-pay-password`
- 领域：认证与账号安全
- 导出：`ChangePayPasswordPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`AuthPasswordToggle`、`Button`、`Input`、`PageHeader`、`SettingsActionItem`、`SettingsNotice`、`SettingsSection`
- 关键 Hooks：`useAppNavigate`、`useFeedback`
- 数据与接口：`userApi`

### CheckoutPage

- 文件：`src/pages/Checkout/index.tsx`
- 路由：`/checkout`
- 领域：订单与交易履约
- 导出：`CheckoutPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useLocation`、`useNavigate`
- 数据与接口：`addressApi`、`shopCartApi`、`shopOrderApi`

### CommonPage

- 文件：`src/pages/CommonPage/index.tsx`
- 路由：`/privacy_policy`、`/user_agreement`
- 领域：个人中心与设置
- 导出：`CommonPage`
- 页面作用：负责 个人中心与设置 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`
- 关键 Hooks：`useNetworkStatus`、`useRequest`
- 数据与接口：`commonApi`

### ConsignmentCouponPage

- 文件：`src/pages/ConsignmentCoupon/index.tsx`
- 路由：`/consignment-voucher`
- 领域：资产与权益管理
- 导出：`ConsignmentCouponPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useInfiniteScroll`、`useNetworkStatus`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`userApi`

### CouponPage

- 文件：`src/pages/Coupon/index.tsx`
- 路由：`/coupon`
- 领域：资产与权益管理
- 导出：`CouponPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useNetworkStatus`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`shopCouponApi`

### CustomerServicePage

- 文件：`src/pages/CustomerService/index.tsx`
- 路由：`/support/chat`
- 领域：消息、客服与社交
- 导出：`CustomerServicePage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`PageHeader`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useSearchParams`
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

### DesignSystemPage

- 文件：`src/pages/DesignSystem/index.tsx`
- 路由：`/design`
- 领域：通用页面
- 导出：`DesignSystemPage`
- 页面作用：负责 通用页面 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`BottomTab`、`Button`、`Card`、`Input`、`Skeleton`、`Tag`
- 关键 Hooks：无自定义 hook 依赖
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

### EditProfilePage

- 文件：`src/pages/EditProfile/index.tsx`
- 路由：`/edit-profile`
- 领域：个人中心与设置
- 导出：`EditProfilePage`
- 页面作用：负责 个人中心与设置 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Button`、`ImagePickerActionSheet`、`Input`、`PageHeader`、`SettingsNotice`、`SettingsSection`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useRequest`
- 数据与接口：`accountApi`、`uploadApi`、`userApi`

### FavoritesPage

- 文件：`src/pages/Favorites/index.tsx`
- 路由：`/favorites`
- 领域：通用页面
- 导出：`FavoritesPage`
- 页面作用：负责 通用页面 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useNetworkStatus`、`useRouteScrollRestoration`
- 数据与接口：`shopCartApi`、`shopFavoriteApi`

### FlashSalePage

- 文件：`src/pages/FlashSale/index.tsx`
- 路由：`/flash-sale`
- 领域：商城与商品浏览
- 导出：`FlashSalePage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useInfiniteScroll`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`flashSaleApi`

### ForgotPasswordPage

- 文件：`src/pages/ForgotPassword/index.tsx`
- 路由：`/forgot-password`
- 领域：认证与账号安全
- 导出：`ResetPasswordBySmsPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：以原生 JSX 结构为主
- 关键 Hooks：无自定义 hook 依赖
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

### FriendDetailPage

- 文件：`src/pages/Friends/FriendDetailPage.tsx`
- 路由：`/friends/:id`
- 领域：消息、客服与社交
- 导出：`FriendDetailPage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ErrorState`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useParams`
- 数据与接口：`teamApi`

### FriendsPage

- 文件：`src/pages/Friends/index.tsx`
- 路由：`/friends`
- 领域：消息、客服与社交
- 导出：`FriendsPage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`teamApi`

### GrowthRightsPage

- 文件：`src/pages/GrowthRights/Page.tsx`
- 路由：`/growth_rights`、`/growth-rights`
- 领域：资产与权益管理
- 导出：`GrowthRightsPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`PageHeader`
- 关键 Hooks：`useAppNavigate`
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

### HashrateExchangePage

- 文件：`src/pages/HashrateExchange/index.tsx`
- 路由：`/hashrate-exchange`
- 领域：资产与权益管理
- 导出：`HashrateExchangePage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：以原生 JSX 结构为主
- 关键 Hooks：`useFeedback`、`useNavigate`
- 数据与接口：`accountApi`

### HelpCenterPage

- 文件：`src/pages/HelpCenter/index.tsx`
- 路由：`/help`、`/help_center`
- 领域：消息、客服与社交
- 导出：`HelpCenterPage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`helpApi`

### HomePage

- 文件：`src/pages/Home/index.tsx`
- 路由：`/`
- 领域：通用页面
- 导出：`HomePage`
- 页面作用：负责 通用页面 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ForceAnnouncementModal`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`accountApi`、`announcementApi`、`bannerApi`、`reservationApi`

### InvitePage

- 文件：`src/pages/Invite/index.tsx`
- 路由：`/invite`
- 领域：消息、客服与社交
- 导出：`InvitePage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ErrorState`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`
- 数据与接口：`teamApi`

### ItemDetailPage

- 文件：`src/pages/ItemDetail/index.tsx`
- 路由：`/item-detail/:sessionId/:packageId`、`/trading/detail/:sessionId/items/:packageId`
- 领域：交易专区与活动场景
- 导出：`ItemDetailPage`
- 页面作用：负责 交易专区与活动场景 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useGrouping`、`useParams`、`useRequest`、`useSearchParams`
- 数据与接口：`collectionItemApi`

### LivePage

- 文件：`src/pages/Live/index.tsx`
- 路由：`/live`
- 领域：交易专区与活动场景
- 导出：`LivePage`
- 页面作用：负责 交易专区与活动场景 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useRequest`
- 数据与接口：`liveVideoApi`

### LiveWebViewPage

- 文件：`src/pages/LiveWebView/index.tsx`
- 路由：`/live/view`
- 领域：交易专区与活动场景
- 导出：`LiveWebViewPage`
- 页面作用：负责 交易专区与活动场景 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useRequest`、`useSearchParams`
- 数据与接口：`liveVideoApi`

### LoginPage

- 文件：`src/pages/Login/index.tsx`
- 路由：`/login`
- 领域：认证与账号安全
- 导出：`LoginPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`AuthAgreement`、`AuthFooterLink`、`AuthFormSection`、`AuthPasswordToggle`、`AuthSmsField`、`AuthTabs`、`AuthTopBar`、`Button` 等
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useLocation`、`useSmsCode`
- 数据与接口：`authApi`

### LogisticsPage

- 文件：`src/pages/Logistics/index.tsx`
- 路由：`/logistics/:id`
- 领域：订单与交易履约
- 导出：`LogisticsPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useNetworkStatus`、`useParams`、`useSearchParams`
- 数据与接口：`shopOrderApi`

### MatchingPage

- 文件：`src/pages/Matching/index.tsx`
- 路由：`/matching`
- 领域：交易专区与活动场景
- 导出：`MatchingPage`
- 页面作用：负责 交易专区与活动场景 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：以原生 JSX 结构为主
- 关键 Hooks：`useAppNavigate`、`useLocation`
- 数据与接口：`rechargeApi`

### MessageCenterPage

- 文件：`src/pages/MessageCenter/index.tsx`
- 路由：`/messages`
- 领域：消息、客服与社交
- 导出：`MessageCenterPage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`OfflineBanner`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`messageApi`

### MessageDetailPage

- 文件：`src/pages/MessageDetail/index.tsx`
- 路由：`/messages/detail/:messageKey`
- 领域：消息、客服与社交
- 导出：`MessageDetailPage`
- 页面作用：负责 消息、客服与社交 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useNetworkStatus`、`useParams`、`useRequest`
- 数据与接口：`messageApi`

### MyCardPacksPage

- 文件：`src/pages/MyCardPacks/index.tsx`
- 路由：`/my-card-packs`
- 领域：资产与权益管理
- 导出：`MyCardPacksPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PullToRefreshContainer`、`Skeleton`、`WalletPageHeader`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useGrouping`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`accountApi`、`membershipCardApi`、`nodeAmplifyCardApi`

### MyCollectionDetailPage

- 文件：`src/pages/MyCollectionDetail/index.tsx`
- 路由：`/my-collection/detail/:id`
- 领域：资产与权益管理
- 导出：`MyCollectionDetailPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ConsignmentEquityCardSelectSheet`、`MyCollectionBottomActions`、`MyCollectionCertificateCard`、`MyCollectionConsignmentModal`、`MyCollectionDetailHeader`、`OfflineBanner`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useGrouping`、`useLocation`、`useNetworkStatus`、`useParams`、`useRequest`
- 数据与接口：`accountApi`、`collectionConsignmentApi`、`collectionTradeApi`、`userApi`、`userCollectionApi`

### MyCollectionPage

- 文件：`src/pages/MyCollection/index.tsx`
- 路由：`/my-collection`
- 领域：资产与权益管理
- 导出：`MyCollectionPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`ConsignableCollectionSelectSheet`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useInfiniteScroll`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`collectionConsignmentApi`、`collectionTradeApi`、`membershipCardApi`

### NotFoundPage

- 文件：`src/pages/NotFound/index.tsx`
- 路由：`/404`
- 领域：通用页面
- 导出：`NotFoundPage`
- 页面作用：负责 通用页面 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`PageHeader`
- 关键 Hooks：`useAppNavigate`
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

### OrderDetailPage

- 文件：`src/pages/OrderDetail/index.tsx`
- 路由：`/order/detail/:id`
- 领域：订单与交易履约
- 导出：`OrderDetailPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ErrorState`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useParams`
- 数据与接口：`shopOrderApi`

### OrderPage

- 文件：`src/pages/Order/index.tsx`
- 路由：`/order`
- 领域：订单与交易履约
- 导出：`OrderPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`CollectibleOrderDetail`、`OfflineBanner`、`OrderHeader`、`OrderListContent`、`OrderStatusTabs`、`OrderTypeSwitcher`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`collectionTradeApi`、`shopOrderApi`

### PaymentAccountsPage

- 文件：`src/pages/PaymentAccounts/index.tsx`
- 路由：`/payment-accounts`
- 领域：订单与交易履约
- 导出：`PaymentAccountsPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Button`、`Card`、`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`userApi`

### PaymentResultPage

- 文件：`src/pages/PaymentResult/index.tsx`
- 路由：`/payment/result`
- 领域：订单与交易履约
- 导出：`PaymentResultPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：以原生 JSX 结构为主
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useGrouping`、`useSearchParams`
- 数据与接口：`rechargeApi`、`shopOrderApi`

### PreOrderPage

- 文件：`src/pages/PreOrder/index.tsx`
- 路由：`/trading/pre-order/:id`
- 领域：订单与交易履约
- 导出：`PreOrderPage`
- 页面作用：负责 订单与交易履约 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`、`ReservationAgreementDialog`、`Skeleton`、`WheelPicker` 等
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useGrouping`、`useMixedPayment`、`useParams`、`useRequest`、`useSearchParams`
- 数据与接口：`collectionItemApi`、`reservationApi`

### ProductDetailPage

- 文件：`src/pages/ProductDetail/index.tsx`
- 路由：`/product/:id`
- 领域：商城与商品浏览
- 导出：`ProductDetailPage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ErrorState`、`OfflineBanner`、`ProductAddressFormSheet`、`ProductAddressFormValue`、`ProductAddressManageSheet`、`ProductDetailHeader`、`ProductOverviewSection`、`ProductPurchaseBar` 等
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useNetworkStatus`、`useParams`、`useRequest`
- 数据与接口：`addressApi`、`shopCartApi`、`shopOrderApi`、`shopProductApi`

### ProductQAPage

- 文件：`src/pages/ProductQA/index.tsx`
- 路由：`/product/:id/qa`
- 领域：商城与商品浏览
- 导出：`ProductQAPage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useNetworkStatus`、`useParams`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`shopProductQaApi`

### QuestionnairePage

- 文件：`src/pages/Questionnaire/index.tsx`
- 路由：`/questionnaire`
- 领域：通用页面
- 导出：`QuestionnairePage`
- 页面作用：负责 通用页面 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`questionnaireApi`

### RealNameAuthPage

- 文件：`src/pages/RealNameAuth/index.tsx`
- 路由：`/auth/real-name`、`/real_name_auth`
- 领域：认证与账号安全
- 导出：`RealNameAuthPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useNetworkStatus`、`useRequest`
- 数据与接口：`userApi`

### RechargePage

- 文件：`src/pages/Recharge/index.tsx`
- 路由：`/recharge`
- 领域：资产与权益管理
- 导出：`RechargePage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PullToRefreshContainer`、`Skeleton`、`WalletPageHeader`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useGrouping`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`accountApi`、`rechargeApi`、`uploadApi`

### RegisterPage

- 文件：`src/pages/Register/index.tsx`
- 路由：`/register`
- 领域：认证与账号安全
- 导出：`RegisterPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`AuthAgreement`、`AuthFooterLink`、`AuthFormSection`、`AuthPasswordToggle`、`AuthSmsField`、`AuthTopBar`、`Button`、`Input`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useLocation`、`useSmsCode`
- 数据与接口：`authApi`

### ReservationDetailPage

- 文件：`src/pages/ReservationDetail/index.tsx`
- 路由：`/reservation_detail/:id`
- 领域：交易专区与活动场景
- 导出：`ReservationDetailPage`
- 页面作用：负责 交易专区与活动场景 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ErrorState`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useParams`、`useRequest`
- 数据与接口：`reservationApi`

### ReservationsPage

- 文件：`src/pages/Reservations/index.tsx`
- 路由：`/reservations`
- 领域：交易专区与活动场景
- 导出：`ReservationsPage`
- 页面作用：负责 交易专区与活动场景 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`OfflineBanner`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useInfiniteScroll`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`reservationApi`

### ResetPasswordBySmsPage

- 文件：`src/pages/ResetPasswordBySms/index.tsx`
- 路由：`/reset-password`
- 领域：认证与账号安全
- 导出：`ResetPasswordBySmsPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`AuthFormSection`、`AuthPasswordToggle`、`AuthSmsField`、`AuthTopBar`、`Button`、`Input`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useSmsCode`
- 数据与接口：`authApi`

### ResetPayPasswordBySmsPage

- 文件：`src/pages/ResetPayPasswordBySms/index.tsx`
- 路由：`/reset-pay-password`
- 领域：认证与账号安全
- 导出：`ResetPayPasswordBySmsPage`
- 页面作用：负责 认证与账号安全 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`AuthFormSection`、`AuthPasswordToggle`、`AuthSmsField`、`Button`、`Input`、`PageHeader`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useSmsCode`
- 数据与接口：`accountApi`、`userApi`

### ReviewsPage

- 文件：`src/pages/Reviews/index.tsx`
- 路由：`/product/:id/reviews`
- 领域：商城与商品浏览
- 导出：`ReviewsPage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PageHeader`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useNetworkStatus`、`useParams`、`useRequest`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`shopProductApi`

### RightsHistoryPage

- 文件：`src/pages/RightsHistory/index.tsx`
- 路由：`/rights/history`
- 领域：资产与权益管理
- 导出：`RightsHistoryPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useGrouping`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`rightsDeclarationApi`

### RightsPage

- 文件：`src/pages/Rights/index.tsx`
- 路由：`/shield`
- 领域：资产与权益管理
- 导出：`RightsPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Button`、`Card`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useGrouping`、`useOldAssetsUnlock`、`useRequest`、`useRouteScrollRestoration`、`useSessionState`
- 数据与接口：`rightsDeclarationApi`、`uploadApi`

### RightsTransferPage

- 文件：`src/pages/RightsTransfer/index.tsx`
- 路由：`/rights_transfer`、`/rights/transfer`
- 领域：资产与权益管理
- 导出：`RightsTransferPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Button`、`Card`、`EmptyState`、`ErrorState`、`PullToRefreshContainer`、`WalletPageHeader`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useGrouping`、`useNetworkStatus`、`useRouteScrollRestoration`
- 数据与接口：`accountTransferApi`

### SearchPage

- 文件：`src/pages/Search/index.tsx`
- 路由：`/search`
- 领域：商城与商品浏览
- 导出：`SearchPage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`shopProductApi`

### SearchResultPage

- 文件：`src/pages/SearchResult/index.tsx`
- 路由：`/search/result`
- 领域：商城与商品浏览
- 导出：`SearchResultPage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PullToRefreshContainer`、`ShopProductPriceDisplay`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useInfiniteScroll`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`、`useSearchParams`、`useSessionState`
- 数据与接口：`shopProductApi`

### SecurityPage

- 文件：`src/pages/Security/index.tsx`
- 路由：`/security`
- 领域：个人中心与设置
- 导出：`SecurityPage`
- 页面作用：负责 个人中心与设置 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`PageHeader`、`SettingsActionItem`、`SettingsNotice`、`SettingsSection`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useRequest`
- 数据与接口：`accountApi`

### ServiceDescriptionPage

- 文件：`src/pages/ServiceDescription/index.tsx`
- 路由：`/service-description`
- 领域：通用页面
- 导出：`ServiceDescriptionPage`
- 页面作用：负责 通用页面 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PageHeader`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useNetworkStatus`
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

### ServiceFeeRechargePage

- 文件：`src/pages/ServiceFeeRecharge/index.tsx`
- 路由：`/service-recharge`
- 领域：资产与权益管理
- 导出：`ServiceFeeRechargePage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`OfflineBanner`、`Skeleton`、`WalletPageHeader`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useGrouping`、`useNetworkStatus`、`useRequest`
- 数据与接口：`accountApi`

### SettingsPage

- 文件：`src/pages/Settings/index.tsx`
- 路由：`/settings`
- 领域：个人中心与设置
- 导出：`SettingsPage`
- 页面作用：负责 个人中心与设置 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ActionSheet`、`AuthPasswordToggle`、`Button`、`Input`、`PageHeader`、`SettingsActionItem`、`SettingsNotice`、`SettingsSection`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useFontScale`、`useRequest`、`useTheme`
- 数据与接口：`accountApi`

### SignInPage

- 文件：`src/pages/SignIn/index.tsx`
- 路由：`/sign-in`
- 领域：签到与活动增长
- 导出：`SignInPage`
- 页面作用：负责 签到与活动增长 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`SignInBalanceCard`、`SignInCalendarModal`、`SignInPageHeader`、`SignInRewardModal`、`SignInRulesCard`、`SignInWithdrawCard`
- 关键 Hooks：`useSignInPage`
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

### StorePage

- 文件：`src/pages/Store/index.tsx`
- 路由：`/store`
- 领域：商城与商品浏览
- 导出：`StorePage`
- 页面作用：负责 商城与商品浏览 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`CartCountBadge`、`EmptyState`、`ErrorState`、`OfflineBanner`、`PullToRefreshContainer`、`ShopProductPriceDisplay`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useCartCount`、`useFeedback`、`useInfiniteScroll`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`flashSaleApi`、`shopProductApi`

### TradingDetailPage

- 文件：`src/pages/TradingDetail/index.tsx`
- 路由：`/trading/detail/:id`
- 领域：交易专区与活动场景
- 导出：`TradingDetailPage`
- 页面作用：负责 交易专区与活动场景 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useInfiniteScroll`、`useParams`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`collectionItemApi`、`collectionSessionApi`

### TradingZonePage

- 文件：`src/pages/TradingZone/index.tsx`
- 路由：`/trading`
- 领域：交易专区与活动场景
- 导出：`TradingZonePage`
- 页面作用：负责 交易专区与活动场景 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`EmptyState`、`ErrorState`、`PageHeader`、`PullToRefreshContainer`
- 关键 Hooks：`useAppNavigate`、`useFeedback`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`collectionSessionApi`

### TransferPage

- 文件：`src/pages/Transfer/index.tsx`
- 路由：`/transfer`
- 领域：资产与权益管理
- 导出：`TransferPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Button`、`Card`、`EmptyState`、`ErrorState`、`PullToRefreshContainer`、`WalletPageHeader`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useGrouping`、`useNetworkStatus`、`useRouteScrollRestoration`
- 数据与接口：`accountTransferApi`

### UserPage

- 文件：`src/pages/User/index.tsx`
- 路由：`/user`
- 领域：个人中心与设置
- 导出：`UserPage`
- 页面作用：负责 个人中心与设置 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`ActionSheet`、`Card`、`OfflineBanner`、`ProfileBalanceCard`、`ProfileHeader`、`ProfileSectionGrid`、`PullToRefreshContainer`、`Skeleton`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useLocation`、`useNavigate`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`accountApi`、`messageApi`、`userApi`

### WithdrawPage

- 文件：`src/pages/Withdraw/index.tsx`
- 路由：`/withdraw`
- 领域：资产与权益管理
- 导出：`WithdrawPage`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`EmptyState`、`ErrorState`、`Input`、`PullToRefreshContainer`、`Skeleton`、`WalletPageHeader`
- 关键 Hooks：`useAppNavigate`、`useAuthSession`、`useFeedback`、`useGrouping`、`useNetworkStatus`、`useRequest`、`useRouteScrollRestoration`
- 数据与接口：`accountApi`、`rechargeApi`、`userApi`

### index

- 文件：`src/pages/GrowthRights/index.tsx`
- 路由：未直接挂载（可能为保留页或由其他容器间接渲染）
- 领域：资产与权益管理
- 导出：`GrowthRightsContent`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：`Card`、`Skeleton`
- 关键 Hooks：`useGrouping`、`useRequest`
- 数据与接口：`accountApi`

### NotFoundPage

- 文件：`src/pages/NotFoundPage.tsx`
- 路由：未直接挂载（可能为保留页或由其他容器间接渲染）
- 领域：通用页面
- 导出：无显式命名导出（默认导出页面）
- 页面作用：负责 通用页面 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：以原生 JSX 结构为主
- 关键 Hooks：无自定义 hook 依赖
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

### RechargeBankCardConfirmModal

- 文件：`src/pages/Recharge/RechargeBankCardConfirmModal.tsx`
- 路由：未直接挂载（可能为保留页或由其他容器间接渲染）
- 领域：资产与权益管理
- 导出：`RechargeBankCardConfirmModal`
- 页面作用：负责 资产与权益管理 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。
- 关键组件依赖：以原生 JSX 结构为主
- 关键 Hooks：无自定义 hook 依赖
- 数据与接口：当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）

## 组件清单

共 72 个组件文件。

### AppErrorBoundary

- 文件：`src/components/AppErrorBoundary.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`Props`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### AuthAgreement

- 文件：`src/components/biz/auth/AuthAgreement.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`AuthAgreementProps`
- 依赖子组件：`Checkbox`
- 依赖 Hooks：无自定义 hook 依赖

### AuthFooterLink

- 文件：`src/components/biz/auth/AuthFooterLink.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`AuthFooterLinkProps`
- 依赖子组件：`Button`
- 依赖 Hooks：无自定义 hook 依赖

### AuthFormSection

- 文件：`src/components/biz/auth/AuthFormSection.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`AuthFormSectionProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### AuthPasswordToggle

- 文件：`src/components/biz/auth/AuthPasswordToggle.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`AuthPasswordToggleProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### AuthSmsField

- 文件：`src/components/biz/auth/AuthSmsField.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`AuthSmsFieldProps`
- 依赖子组件：`Button`、`Input`
- 依赖 Hooks：无自定义 hook 依赖

### AuthTabs

- 文件：`src/components/biz/auth/AuthTabs.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`AuthTabsProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### AuthTopBar

- 文件：`src/components/biz/auth/AuthTopBar.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`AuthTopBarProps`
- 依赖子组件：`Button`
- 依赖 Hooks：`useFeedback`

### CouponBottomSheet

- 文件：`src/components/biz/CouponBottomSheet.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`CouponBottomSheetProps`
- 依赖子组件：`Skeleton`
- 依赖 Hooks：无自定义 hook 依赖

### CustomerServicePanel

- 文件：`src/components/biz/CustomerServicePanel.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`CustomerServicePanelProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：`useFeedback`

### ForceAnnouncementModal

- 文件：`src/components/biz/ForceAnnouncementModal.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ForceAnnouncementModalProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### ImagePickerActionSheet

- 文件：`src/components/biz/ImagePickerActionSheet.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ImagePickerActionSheetProps`
- 依赖子组件：`ActionSheet`、`ActionSheetGroup`
- 依赖 Hooks：无自定义 hook 依赖

### RegionPickerSheet

- 文件：`src/components/biz/RegionPickerSheet.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`RegionPickerSheetProps`
- 依赖子组件：`WheelPicker`、`WheelPickerItem`
- 依赖 Hooks：无自定义 hook 依赖

### ReservationAgreementDialog

- 文件：`src/components/biz/ReservationAgreementDialog.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ReservationAgreementDialogProps`
- 依赖子组件：`EmptyState`、`ErrorState`、`Skeleton`
- 依赖 Hooks：无自定义 hook 依赖

### SettingsActionItem

- 文件：`src/components/biz/settings/SettingsSection.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`SettingsActionItemProps`、`SettingsNoticeProps`、`SettingsSectionProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### WebViewActionSheet

- 文件：`src/components/biz/WebViewActionSheet.tsx`
- 组件分类：业务复用组件
- 组件作用：用于 业务复用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`WebViewActionSheetProps`
- 依赖子组件：`ActionSheet`、`ActionSheetGroup`
- 依赖 Hooks：无自定义 hook 依赖

### AppLayout

- 文件：`src/components/layout/AppLayout.tsx`
- 组件分类：布局组件
- 组件作用：用于 布局组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：`BottomTab`、`FeedbackProvider`
- 依赖 Hooks：`useAuthSession`、`useFeedback`、`useLocation`、`useNavigate`、`useSwipeBack`

### BottomTab

- 文件：`src/components/layout/BottomTab.tsx`
- 组件分类：布局组件
- 组件作用：用于 布局组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：`useNavigate`

### OfflineBanner

- 文件：`src/components/layout/OfflineBanner.tsx`
- 组件分类：布局组件
- 组件作用：用于 布局组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`OfflineBannerProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### PageHeader

- 文件：`src/components/layout/PageHeader.tsx`
- 组件分类：布局组件
- 组件作用：用于 布局组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`PageHeaderProps`
- 依赖子组件：`OfflineBanner`
- 依赖 Hooks：`useAppNavigate`

### WalletHeaderActionButton

- 文件：`src/components/layout/WalletPageHeader.tsx`
- 组件分类：布局组件
- 组件作用：用于 布局组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`WalletPageHeaderProps`
- 依赖子组件：`PageHeader`
- 依赖 Hooks：无自定义 hook 依赖

### ActionSheet

- 文件：`src/components/ui/ActionSheet.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ActionSheetProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### Badge

- 文件：`src/components/ui/Badge.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`BadgeProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### Button

- 文件：`src/components/ui/Button.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ButtonProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### Card

- 文件：`src/components/ui/Card.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`CardProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### CartCountBadge

- 文件：`src/components/ui/CartCountBadge.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`CartCountBadgeProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### Checkbox

- 文件：`src/components/ui/Checkbox.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### EmptyState

- 文件：`src/components/ui/EmptyState.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`EmptyStateProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### ErrorState

- 文件：`src/components/ui/ErrorState.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ErrorStateProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### FeedbackProvider

- 文件：`src/components/ui/FeedbackProvider.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：`useFeedback`

### Input

- 文件：`src/components/ui/Input.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### LoadingSkeleton

- 文件：`src/components/ui/LoadingSkeleton.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`LoadingSkeletonProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### PullToRefreshContainer

- 文件：`src/components/ui/PullToRefreshContainer.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`PullToRefreshContainerProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### Skeleton

- 文件：`src/components/ui/Skeleton.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### Tag

- 文件：`src/components/ui/Tag.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### WheelPicker

- 文件：`src/components/ui/WheelPicker.tsx`
- 组件分类：基础 UI 组件
- 组件作用：用于 基础 UI 组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`WheelPickerProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### CollectibleBuyOrderCard

- 文件：`src/features/order/components/CollectibleOrderCard.tsx`
- 组件分类：信息卡片组件
- 组件作用：用于 信息卡片组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`BuyOrderCardProps`、`SellOrderCardProps`
- 依赖子组件：`Card`
- 依赖 Hooks：无自定义 hook 依赖

### CollectibleOrderDetail

- 文件：`src/features/order/components/CollectibleOrderDetail.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`CollectibleOrderDetailProps`
- 依赖子组件：`Button`、`Card`、`ErrorState`、`Skeleton`
- 依赖 Hooks：`useFeedback`

### MallOrderCard

- 文件：`src/features/order/components/MallOrderCard.tsx`
- 组件分类：信息卡片组件
- 组件作用：用于 信息卡片组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`MallOrderCardProps`
- 依赖子组件：`Button`、`Card`
- 依赖 Hooks：无自定义 hook 依赖

### OrderHeader

- 文件：`src/features/order/components/OrderHeader.tsx`
- 组件分类：页面头部组件
- 组件作用：用于 页面头部组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`OrderHeaderProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### OrderListContent

- 文件：`src/features/order/components/OrderListContent.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`OrderListContentProps`
- 依赖子组件：`Button`、`Card`、`CollectibleBuyOrderCard`、`CollectibleSellOrderCard`、`MallOrderCard`、`Skeleton`
- 依赖 Hooks：无自定义 hook 依赖

### OrderStatusTabs

- 文件：`src/features/order/components/OrderStatusTabs.tsx`
- 组件分类：标签切换组件
- 组件作用：用于 标签切换组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`OrderStatusTabsProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### OrderTypeSwitcher

- 文件：`src/features/order/components/OrderTypeSwitcher.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`OrderTypeSwitcherProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### ProductAddressFormSheet

- 文件：`src/features/product-detail/components/ProductAddressFormSheet.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductAddressFormSheetProps`
- 依赖子组件：`Button`
- 依赖 Hooks：无自定义 hook 依赖

### ProductAddressManageSheet

- 文件：`src/features/product-detail/components/ProductAddressManageSheet.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductAddressManageSheetProps`
- 依赖子组件：`Button`
- 依赖 Hooks：无自定义 hook 依赖

### ProductDetailHeader

- 文件：`src/features/product-detail/components/ProductDetailHeader.tsx`
- 组件分类：页面头部组件
- 组件作用：用于 页面头部组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductDetailHeaderProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### ProductOverviewSection

- 文件：`src/features/product-detail/components/ProductOverviewSection.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductOverviewSectionProps`
- 依赖子组件：`Skeleton`
- 依赖 Hooks：无自定义 hook 依赖

### ProductPurchaseBar

- 文件：`src/features/product-detail/components/ProductPurchaseBar.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductPurchaseBarProps`
- 依赖子组件：`CartCountBadge`
- 依赖 Hooks：无自定义 hook 依赖

### ProductReviewsSection

- 文件：`src/features/product-detail/components/ProductReviewsSection.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductReviewsSectionProps`
- 依赖子组件：`Skeleton`
- 依赖 Hooks：无自定义 hook 依赖

### ProductServiceSheet

- 文件：`src/features/product-detail/components/ProductServiceSheet.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductServiceSheetProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### ProductSkuSheet

- 文件：`src/features/product-detail/components/ProductSkuSheet.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductSkuSheetProps`
- 依赖子组件：`Button`
- 依赖 Hooks：无自定义 hook 依赖

### ProductTabsSection

- 文件：`src/features/product-detail/components/ProductTabsSection.tsx`
- 组件分类：标签切换组件
- 组件作用：用于 标签切换组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProductTabsSectionProps`
- 依赖子组件：`Skeleton`
- 依赖 Hooks：无自定义 hook 依赖

### ShopProductPriceDisplay

- 文件：`src/features/shop-product/components/ShopProductPriceDisplay.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ShopProductPriceDisplayProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### GrowthRightsContent

- 文件：`src/pages/GrowthRights/index.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：`Card`、`Skeleton`
- 依赖 Hooks：`useGrouping`、`useRequest`

### ConsignableCollectionSelectSheet

- 文件：`src/pages/MyCollection/components/ConsignableCollectionSelectSheet.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ConsignableCollectionSelectSheetProps`
- 依赖子组件：`ConsignmentEquityCardSelectSheet`
- 依赖 Hooks：`useInfiniteScroll`

### ConsignmentEquityCardSelectSheet

- 文件：`src/pages/MyCollectionDetail/components/ConsignmentEquityCardSelectSheet.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ConsignmentEquityCardSelectSheetProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### MyCollectionBottomActions

- 文件：`src/pages/MyCollectionDetail/components/MyCollectionBottomActions.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`MyCollectionBottomActionsProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### MyCollectionCertificateCard

- 文件：`src/pages/MyCollectionDetail/components/MyCollectionCertificateCard.tsx`
- 组件分类：信息卡片组件
- 组件作用：用于 信息卡片组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`MyCollectionCertificateCardProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### MyCollectionConsignmentModal

- 文件：`src/pages/MyCollectionDetail/components/MyCollectionConsignmentModal.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`MyCollectionConsignmentModalProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### MyCollectionDetailHeader

- 文件：`src/pages/MyCollectionDetail/components/MyCollectionDetailHeader.tsx`
- 组件分类：页面头部组件
- 组件作用：用于 页面头部组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`MyCollectionDetailHeaderProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### NotFoundPage

- 文件：`src/pages/NotFoundPage.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### RechargeBankCardConfirmModal

- 文件：`src/pages/Recharge/RechargeBankCardConfirmModal.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`RechargeBankCardConfirmModalProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### SignInBalanceCard

- 文件：`src/pages/SignIn/components/SignInBalanceCard.tsx`
- 组件分类：信息卡片组件
- 组件作用：用于 信息卡片组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`SignInBalanceCardProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### SignInCalendarModal

- 文件：`src/pages/SignIn/components/SignInCalendarModal.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`SignInCalendarModalProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### SignInPageHeader

- 文件：`src/pages/SignIn/components/SignInPageHeader.tsx`
- 组件分类：页面头部组件
- 组件作用：用于 页面头部组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`SignInPageHeaderProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### SignInRewardModal

- 文件：`src/pages/SignIn/components/SignInRewardModal.tsx`
- 组件分类：弹层与交互面板组件
- 组件作用：用于 弹层与交互面板组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`SignInRewardModalProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### SignInRulesCard

- 文件：`src/pages/SignIn/components/SignInRulesCard.tsx`
- 组件分类：信息卡片组件
- 组件作用：用于 信息卡片组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`SignInRulesCardProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### SignInWithdrawCard

- 文件：`src/pages/SignIn/components/SignInWithdrawCard.tsx`
- 组件分类：信息卡片组件
- 组件作用：用于 信息卡片组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`SignInWithdrawCardProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### CoinsIcon

- 文件：`src/pages/User/components/CoinsIcon.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：未定义独立 Props 接口（可能使用内联类型）
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### ProfileBalanceCard

- 文件：`src/pages/User/components/ProfileBalanceCard.tsx`
- 组件分类：信息卡片组件
- 组件作用：用于 信息卡片组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProfileBalanceCardProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：`useGrouping`

### ProfileHeader

- 文件：`src/pages/User/components/ProfileHeader.tsx`
- 组件分类：页面头部组件
- 组件作用：用于 页面头部组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProfileHeaderProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

### ProfileSectionGrid

- 文件：`src/pages/User/components/ProfileSectionGrid.tsx`
- 组件分类：通用组件
- 组件作用：用于 通用组件 场景，承接页面层拆分后的可复用 UI/交互单元。
- Props 结构：`ProfileSectionGridProps`
- 依赖子组件：以基础样式与 DOM 结构为主
- 依赖 Hooks：无自定义 hook 依赖

## Hooks 详细说明

共 16 个 hook 文件。

### useAppResumeEffect

- 文件：`src/hooks/useAppLifecycle.ts`
- 作用：封装“应用从后台回到前台”触发逻辑，只在状态从非 `active` 切到 `active` 时执行回调。
- 输入：`callback: () => void`。
- 输出：无返回值，内部通过 `useEffectEvent` 保证回调引用稳定。
- 依赖：`useAppLifecycle`、`useAppLifecycleSnapshot`

### useAppLifecycle

- 文件：`src/hooks/useAppLifecycle.ts`
- 作用：对 `lib/appLifecycle` 的 React Hook 转发，读取当前应用前后台状态与网络状态快照。
- 输入：无。
- 输出：`appState`、`isOffline`、`lastUpdatedAt` 等生命周期字段（由底层库提供）。
- 依赖：`useAppLifecycleSnapshot`、`useAppResumeEffect`

### useAppNavigate

- 文件：`src/hooks/useAppNavigate.ts`
- 作用：统一导航能力入口，透传 `lib/navigation` 中的应用级跳转方法。
- 输入：无。
- 输出：`goTo`、`goBack` 等导航方法（由底层实现提供）。
- 依赖：无额外自定义 Hook 依赖

### useAuthSession

- 文件：`src/hooks/useAuthSession.ts`
- 作用：订阅登录态快照，组件内实时感知认证状态变化。
- 输入：无。
- 输出：`session`、`isAuthenticated`、`clearAuthSession`。
- 依赖：无额外自定义 Hook 依赖

### useCartCount

- 文件：`src/hooks/useCartCount.ts`
- 作用：管理购物车数量读取与跨页面同步，未登录时自动归零。
- 输入：无。
- 输出：`cartCount`、`loading`、`reloadCartCount`。并提供 `notifyCartCountSync()` 触发全局刷新事件。
- 依赖：`useAuthSession`、`useRequest`

### useClaimUnlock

- 文件：`src/hooks/useClaimUnlock.ts`
- 作用：维护权益解锁状态对象，支持局部 patch 更新。
- 输入：`options.initialStatus`（可选初始状态覆盖）。
- 输出：`unlockStatus`、`updateUnlockStatus`。
- 依赖：无额外自定义 Hook 依赖

### useInfiniteScroll

- 文件：`src/hooks/useInfiniteScroll.ts`
- 作用：基于 `IntersectionObserver` 的触底加载 Hook。
- 输入：`targetRef`、`hasMore`、`loading`、`onLoadMore` 及阈值配置。
- 输出：无返回值；监听命中时自动调用 `onLoadMore`。
- 依赖：无额外自定义 Hook 依赖

### useNetworkStatus

- 文件：`src/hooks/useNetworkStatus.ts`
- 作用：读取离线状态并提供手动刷新网络快照方法。
- 输入：无。
- 输出：`isOffline`、`refreshStatus`。
- 依赖：`useAppLifecycle`

### useOldAssetsUnlock

- 文件：`src/hooks/useOldAssetsUnlock.ts`
- 作用：拉取“老资产解锁”状态并映射到前端统一结构，封装解锁提交与重载。
- 输入：无（内部依赖登录态）。
- 输出：`unlockStatus`、`statusError`、`reloadStatus`、`unlock`。
- 依赖：`useAuthSession`、`useRequest`

### usePullToRefresh

- 文件：`src/hooks/usePullToRefresh.ts`
- 作用：处理移动端下拉刷新手势，内置阻尼、阈值与刷新状态机。
- 输入：`containerRef`、`onRefresh`、`disabled`。
- 输出：`pullDistance`、`pulling`、`refreshing`。
- 依赖：无额外自定义 Hook 依赖

### useRequest

- 文件：`src/hooks/useRequest.ts`
- 作用：通用请求状态管理：支持缓存 TTL、并发取消、错误归一、手动/自动请求。
- 输入：`service(signal)` 与 `options`（`cacheKey`、`deps`、`manual` 等）。
- 输出：`data`、`error`、`loading`、`reload`、`setData`。
- 依赖：无额外自定义 Hook 依赖

### useRouteScrollRestoration

- 文件：`src/hooks/useRouteScrollRestoration.ts`
- 作用：保存并恢复路由容器滚动位置，主要处理浏览器后退（`POP`）场景。
- 输入：`containerRef`、`restoreWhen`、`restoreDeps`、`namespace` 等。
- 输出：无返回值；副作用为自动写入/读取 `sessionStorage` 并恢复 `scrollTop`。
- 依赖：`useLocation`、`useNavigationType`

### useSessionState

- 文件：`src/hooks/useSessionState.ts`
- 作用：将 React 状态与 `sessionStorage` 双向同步，支持自定义序列化/反序列化。
- 输入：`key`、`initialValue`、`options`。
- 输出：`[value, setValue]`。
- 依赖：无额外自定义 Hook 依赖

### useSmsCode

- 文件：`src/hooks/useSmsCode.ts`
- 作用：封装短信验证码发送流程，包含手机号校验、倒计时与错误提示。
- 输入：`event`、`countdownSeconds`。
- 输出：`buttonText`、`canSend`、`message`、`sendCode`、`sending`、`setMessage`。
- 依赖：`useFeedback`

### useSwipeBack

- 文件：`src/hooks/useSwipeBack.ts`
- 作用：移动端左边缘滑动返回手势，直接操作 DOM 保持高帧率动画。
- 输入：`containerRef`、`contentRef`、`shadowRef`、`arrowRef`、`disabled`。
- 输出：无返回值；触发阈值后执行 `navigate(-1)`。
- 依赖：`useNavigate`

### useViewScrollSnapshot

- 文件：`src/hooks/useViewScrollSnapshot.ts`
- 作用：在视图切换时缓存并恢复滚动位置，支持非激活时自动归零。
- 输入：`active`、`containerRef`、`enabled`、`resetOnDeactivate`。
- 输出：无返回值；副作用为切换时写回 `scrollTop`。
- 依赖：无额外自定义 Hook 依赖

### useSignInPage

- 文件：`src/pages/SignIn/hooks/useSignInPage.ts`
- 作用：签到页聚合 Hook：并行加载规则/进度/用户信息，并封装签到、邀请、提现逻辑。
- 输入：无。
- 输出：返回签到页完整视图模型（loading、活动信息、日历控制、按钮事件处理器等）。
- 依赖：`useAppNavigate`、`useFeedback`

## 维护建议

1. 新增页面时：同步在路由与本文档页面清单补充“路由、关键组件、关键 Hook、API”。
2. 新增业务组件时：优先放在 `src/components/biz` 或对应 `features/*/components`，并写清输入输出。
3. 新增 Hook 时：建议保持“单一职责 + 明确返回结构”，并在本文档中补上输入/输出说明。
