# 项目文档 - 树交所（文化商品数字化交易平台）

## 项目概述

本项目是一个基于 React + TypeScript + Vite 构建的移动端应用，主要用于文化商品（如艺术品、藏品）的数字化交易。该平台支持商品浏览、购买、寄售、提货等完整的交易流程，并提供用户账户管理、资产管理、签到活动等功能。

---

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 图标库**: Lucide React
- **样式方案**: TailwindCSS
- **状态管理**: React useState/useEffect (无第三方状态库)
- **API 通信**: 原生 Fetch API 封装

---

## 项目结构

```
shujiaos/
├── App.tsx                 # 主应用入口，路由控制
├── index.tsx               # React 根挂载点
├── types.ts                # TypeScript 类型定义
├── constants.ts            # 常量配置与测试数据
├── vite.config.ts          # Vite 构建配置
├── components/             # 公共组件
│   ├── BottomNav.tsx       # 底部导航栏
│   ├── GridShowcase.tsx    # 网格展示组件
│   ├── ProductSpecSheet.tsx # 商品规格弹窗
│   └── SubPageLayout.tsx   # 子页面布局
├── pages/                  # 页面组件 (45个)
│   ├── Home.tsx            # 首页
│   ├── Market.tsx          # 商城
│   ├── News.tsx            # 资讯
│   ├── Orders.tsx          # 订单入口
│   ├── Profile.tsx         # 个人中心
│   └── ...                 # 其他功能页面
└── services/
    └── api.ts              # API 接口封装 (4287行)
```

---

## 一、功能模块详细说明

### 1. 用户认证模块

#### 1.1 登录 (`Login.tsx`)
- 手机号 + 密码登录
- 手机号格式验证（1[3-9]开头的11位数字）
- 密码可见/隐藏切换
- 记住密码功能
- 用户协议和隐私政策确认
- 登录成功后保存 Token 和用户信息到 localStorage

#### 1.2 注册 (`Register.tsx`)
- 手机号、登录密码、支付密码、邀请码输入
- 支持从 URL 参数自动读取邀请码
- 用户协议和隐私政策确认
- 注册成功后自动跳转登录页

#### 1.3 忘记密码 (`ForgotPassword.tsx`)
- 手机号验证
- 重置密码流程

### 2. 首页模块 (`Home.tsx`)

#### 2.1 轮播图 Banner
- 从接口获取轮播图列表
- 支持自动轮播和手势滑动
- 点击跳转对应页面

#### 2.2 快捷入口
- **中心介绍**: 跳转关于我们页面
- **平台动态**: 跳转资讯页面
- **艺术家**: 跳转艺术家展示页面
- **交易专区**: 跳转交易专区页面

#### 2.3 公告滚动
- 显示平台公告和平台动态
- 点击跳转公告详情

#### 2.4 艺术家展示
- 展示艺术家列表
- 点击查看艺术家详情

### 3. 商城模块 (`Market.tsx`)

#### 3.1 商品列表
- 支持分类筛选（全部、热销、最新）
- 支持搜索功能
- 列表/网格视图切换
- 从接口加载商品数据

#### 3.2 商品详情 (`ProductDetail.tsx`)
- 商品图片展示
- 价格、艺术家信息
- 立即购买功能

#### 3.3 商品规格弹窗 (`ProductSpecSheet.tsx`)
- 选择购买数量
- 余额支付/积分兑换
- 创建订单并支付

### 4. 资讯模块 (`News.tsx`)

#### 4.1 资讯列表
- **平台公告**: 系统公告消息
- **平台动态**: 活动动态信息
- 未读/已读状态显示
- 一键全部已读

#### 4.2 公告详情 (`AnnouncementDetail.tsx`)
- 公告标题、时间、内容展示
- HTML 内容解析显示

### 5. 订单模块

#### 5.1 订单入口 (`Orders.tsx`)
- 商品订单入口
- 交易订单入口
- 提货订单入口
- 积分订单入口

#### 5.2 订单列表 (`OrderListPage.tsx`)
- **商品订单**: 待付款、待发货、待收货、已完成
- **交易订单**: 全部、待付款、已完成
- **提货订单**: 待发货、待收货、已完成
- **积分订单**: 待发货、待收货、已完成

功能包括:
- 订单状态筛选
- 去付款
- 确认收货
- 查看详情
- 删除订单

### 6. 个人中心模块 (`Profile.tsx`)

#### 6.1 用户信息
- 头像、昵称、用户类型显示
- 用户等级标签

#### 6.2 资产信息
- 可用余额
- 服务费余额
- 待提现金额
- 可提现金额
- 累计收益
- 积分

#### 6.3 功能入口
- **账户与安全**: 实名认证、代理商认证、银行卡管理、地址管理
- **交易中心**: 我的藏品、订单管理、寄售券、累计权益
- **服务中心**: 帮助中心、用户协议、在线服务、问卷调查

### 7. 资产管理模块 (`AssetView.tsx`)

#### 7.1 资产总览
- 可用余额
- 服务费余额
- 待提现金额
- 可提现金额

#### 7.2 藏品管理
- 我的藏品列表
- 提货操作（48小时限制）
- 寄售操作（需扣减寄售券）
- 寄售状态：未寄售、待寄售、寄售中、已售出、寄售失败

#### 7.3 明细记录
- 余额明细
- 充值订单
- 提现订单
- 服务费明细

### 8. 充值提现模块

#### 8.1 余额充值 (`BalanceRecharge.tsx`)
- 选择公司收款账户
- 输入充值金额
- 上传支付凭证
- 提交充值订单

#### 8.2 余额提现 (`BalanceWithdraw.tsx`)
- 显示可提现金额
- 选择收款账户
- 输入提现金额
- 输入支付密码
- 提交提现申请

#### 8.3 服务费充值 (`ServiceRecharge.tsx`)
- 使用余额充值服务费
- 划转功能

### 9. 交易专区模块 (`TradingZone.tsx`)

#### 9.1 交易专场
- 专场列表展示
- 专场状态：进行中、即将开始、已结束
- 倒计时显示

#### 9.2 寄售商品
- 正价商品列表
- 寄售商品列表
- 商品价格、库存显示
- 点击购买

### 10. 签到活动模块 (`SignIn.tsx`)

#### 10.1 签到日历
- 显示本月签到记录
- 签到按钮
- 签到奖励显示

#### 10.2 提现进度
- 显示可提现金额
- 邀请好友增加提现额度
- 绑定银行卡提现

#### 10.3 签到规则
- 签到规则说明
- 提现规则说明

### 11. 我的藏品模块 (`MyCollection.tsx`)

#### 11.1 藏品列表
- 已购买藏品展示
- 藏品图片、名称、价格
- 购买时间
- 提货/寄售状态

#### 11.2 藏品操作
- **提货**: 将藏品实物发货到收货地址
- **寄售**: 将藏品上架到交易市场出售
- 48小时购买限制检查
- 寄售券检查

### 12. 设置模块 (`Settings.tsx`)

- 编辑资料
- 修改登录密码
- 修改支付密码
- 通知设置
- 银行卡管理
- 隐私政策
- 关于我们
- 注销账户
- 退出登录

### 13. 其他功能页面

#### 13.1 实名认证 (`RealNameAuth.tsx`)
- 姓名、身份证号输入
- 身份证正反面上传
- 提交认证

#### 13.2 代理商认证 (`AgentAuth.tsx`)
- 代理商资料填写
- 认证状态查询

#### 13.3 银行卡管理 (`CardManagement.tsx`)
- 添加银行卡
- 银行卡列表
- 设置默认银行卡
- 删除银行卡

#### 13.4 地址管理 (`AddressList.tsx`)
- 添加收货地址
- 地址列表
- 设置默认地址
- 编辑/删除地址

#### 13.5 邀请好友 (`InviteFriends.tsx`)
- 邀请码展示
- 邀请链接分享
- 二维码分享

#### 13.6 我的好友 (`MyFriends.tsx`)
- 团队成员列表
- 团队业绩

#### 13.7 帮助中心 (`HelpCenter.tsx`)
- 常见问题分类
- 问题详情展示

#### 13.8 在线客服 (`OnlineService.tsx`)
- 联系客服

---

## 二、深度组件化策略优化建议

### 2.1 当前问题分析

1. **组件粒度不够细**: 许多页面组件超过500行代码（如 `AssetView.tsx` 1158行、`OrderListPage.tsx` 1405行），包含过多逻辑和UI代码

2. **重复代码较多**: 
   - 加载状态展示逻辑在多个页面重复
   - 空状态展示逻辑重复
   - 列表渲染逻辑相似但未复用
   - 弹窗/模态框逻辑重复

3. **布局组件抽象不足**: 仅有 `SubPageLayout` 一个布局组件，缺少更多通用布局

### 2.2 优化建议

#### 2.2.1 抽取通用UI组件

```typescript
// 建议新增组件

// 1. 加载状态组件
// components/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

// 2. 空状态组件
// components/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 3. 确认弹窗组件
// components/ConfirmModal.tsx
interface ConfirmModalProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

// 4. 结果提示弹窗
// components/ResultModal.tsx
interface ResultModalProps {
  open: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  content?: string;
  onClose: () => void;
}

// 5. 卡片组件
// components/Card.tsx
interface CardProps {
  title?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// 6. 列表项组件
// components/ListItem.tsx
interface ListItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  arrow?: boolean;
  onClick?: () => void;
}
```

#### 2.2.2 页面组件拆分建议

```typescript
// AssetView.tsx 拆分为:
// - AssetView.tsx (主容器)
// - AssetHeader.tsx (资产概览头部)
// - AssetTabs.tsx (Tab切换)
// - BalanceLogList.tsx (余额明细列表)
// - RechargeOrderList.tsx (充值订单列表)
// - WithdrawOrderList.tsx (提现订单列表)
// - CollectionList.tsx (藏品列表)
// - CollectionActionModal.tsx (藏品操作弹窗)

// OrderListPage.tsx 拆分为:
// - OrderListPage.tsx (主容器)
// - OrderTabs.tsx (订单状态Tab)
// - OrderItem.tsx (单个订单项)
// - OrderDetailModal.tsx (订单详情弹窗)
// - PaymentModal.tsx (支付弹窗)
```

#### 2.2.3 布局组件增强

```typescript
// 建议新增布局组件

// 1. 页面容器
// components/PageContainer.tsx
interface PageContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  padding?: boolean;
}

// 2. 列表容器
// components/ListContainer.tsx
interface ListContainerProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyText?: string;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// 3. 表单容器
// components/FormContainer.tsx
interface FormContainerProps {
  children: React.ReactNode;
  onSubmit: () => void;
  submitText?: string;
  loading?: boolean;
  disabled?: boolean;
}
```

---

## 三、逻辑复用与抽象优化建议

### 3.1 当前问题分析

1. **数据获取逻辑重复**: 每个页面都有类似的 `useEffect + try/catch + loading/error` 模式

2. **状态管理分散**: 用户信息、Token 等通过 localStorage 在各处访问，没有统一管理

3. **工具函数内联**: 时间格式化、金额格式化等函数在多个文件中重复定义

4. **API 调用模式相似**: 但没有封装统一的请求 Hook

### 3.2 优化建议

#### 3.2.1 自定义 Hooks 抽取

```typescript
// hooks/useRequest.ts - 通用请求 Hook
interface UseRequestOptions<T> {
  manual?: boolean;
  defaultParams?: any;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

function useRequest<T>(
  service: (...args: any[]) => Promise<ApiResponse<T>>,
  options?: UseRequestOptions<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const run = async (...args: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service(...args);
      if (res.code === 1) {
        setData(res.data);
        options?.onSuccess?.(res.data);
      } else {
        throw new Error(res.msg);
      }
    } catch (e) {
      setError(e);
      options?.onError?.(e);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, run, setData };
}

// hooks/useAuth.ts - 认证状态 Hook
function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // 登录、登出、刷新用户信息等方法
  const login = (payload: LoginSuccessPayload) => { ... };
  const logout = () => { ... };
  const refreshUser = () => { ... };
  
  return { isLoggedIn, user, token, login, logout, refreshUser };
}

// hooks/useUserInfo.ts - 用户信息 Hook
function useUserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadUserInfo();
  }, []);
  
  const loadUserInfo = async () => { ... };
  const refreshUserInfo = () => loadUserInfo();
  
  return { userInfo, loading, refreshUserInfo };
}

// hooks/usePagination.ts - 分页 Hook
function usePagination<T>(
  fetchFn: (page: number, pageSize: number) => Promise<ApiResponse<{ list: T[]; total: number }>>
) {
  const [list, setList] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const loadMore = async () => { ... };
  const refresh = () => { ... };
  
  return { list, loading, hasMore, loadMore, refresh };
}

// hooks/useModal.ts - 弹窗控制 Hook
function useModal() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const show = (modalData?: any) => {
    setData(modalData);
    setOpen(true);
  };
  
  const hide = () => {
    setOpen(false);
    setData(null);
  };
  
  return { open, data, show, hide };
}
```

#### 3.2.2 Context 状态管理

```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
  isLoggedIn: boolean;
  user: UserInfo | null;
  token: string | null;
  login: (payload: LoginSuccessPayload) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 集中管理认证状态
}

// contexts/AppContext.tsx - 应用全局状态
interface AppContextValue {
  newsList: NewsItem[];
  setNewsList: (list: NewsItem[]) => void;
  markNewsAsRead: (id: string) => void;
  markAllNewsAsRead: () => void;
}
```

#### 3.2.3 工具函数统一

```typescript
// utils/format.ts
export const formatTime = (timestamp: number | string | null): string => { ... };
export const formatDate = (timestamp: number | string): string => { ... };
export const formatAmount = (value?: string | number): string => { ... };
export const formatPhone = (phone: string): string => { ... };

// utils/validation.ts
export const isValidPhone = (phone: string): boolean => { ... };
export const isValidIdCard = (idCard: string): boolean => { ... };
export const isValidPassword = (password: string): boolean => { ... };

// utils/storage.ts
export const storage = {
  get: <T>(key: string): T | null => { ... },
  set: <T>(key: string, value: T): void => { ... },
  remove: (key: string): void => { ... },
  clear: (): void => { ... },
};
```

---

## 四、性能优化建议

### 4.1 当前问题分析

1. **无组件懒加载**: 所有45个页面组件同步加载，首屏加载时间长

2. **无状态缓存**: 每次进入页面都重新请求数据

3. **列表无虚拟滚动**: 长列表直接渲染所有项

4. **图片无优化**: 未使用懒加载或尺寸优化

5. **重复渲染**: 未使用 `memo`、`useMemo`、`useCallback` 优化

### 4.2 优化建议

#### 4.2.1 路由懒加载

```typescript
// App.tsx 中使用 React.lazy
const Home = React.lazy(() => import('./pages/Home'));
const Market = React.lazy(() => import('./pages/Market'));
const AssetView = React.lazy(() => import('./pages/AssetView'));
// ... 其他页面

// 配合 Suspense 使用
<Suspense fallback={<LoadingSpinner fullScreen />}>
  {renderContent()}
</Suspense>
```

#### 4.2.2 数据缓存策略

```typescript
// 使用 SWR 或 React Query 进行数据缓存
// 或自定义简单缓存

// hooks/useCache.ts
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TIME = 5 * 60 * 1000; // 5分钟缓存

function useCachedRequest<T>(
  key: string,
  fetchFn: () => Promise<ApiResponse<T>>
) {
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
      return cached.data;
    }
    return null;
  });
  
  const refresh = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
        setData(cached.data);
        return;
      }
    }
    // 请求数据并缓存
  };
  
  return { data, refresh };
}
```

#### 4.2.3 列表虚拟化

```typescript
// 使用 react-window 或 react-virtualized
// 或实现简单虚拟列表

// components/VirtualList.tsx
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight: number;
}

function VirtualList<T>({ items, itemHeight, renderItem, containerHeight }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 4.2.4 图片优化

```typescript
// components/LazyImage.tsx
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

function LazyImage({ src, alt, className, placeholder }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [src]);
  
  return (
    <img
      ref={imgRef}
      alt={alt}
      className={className}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      src={placeholder || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
    />
  );
}
```

#### 4.2.5 组件性能优化

```typescript
// 使用 React.memo 包装纯展示组件
const OrderItem = React.memo(function OrderItem({ order, onPay, onDelete }: OrderItemProps) {
  // ...
});

// 使用 useMemo 缓存计算结果
const filteredProducts = useMemo(() => {
  return products.filter(p => p.category === activeCategory);
}, [products, activeCategory]);

// 使用 useCallback 缓存回调函数
const handleProductClick = useCallback((product: Product) => {
  onProductSelect?.(product);
}, [onProductSelect]);
```

---

## 五、工程化与规范优化建议

### 5.1 当前问题分析

1. **缺少 ESLint/Prettier**: 代码风格不统一

2. **缺少单元测试**: 无测试覆盖

3. **无错误边界**: 组件错误可能导致整个应用崩溃

4. **无 API Mock**: 开发依赖后端接口

5. **常量管理分散**: 部分常量在组件内定义

### 5.2 优化建议

#### 5.2.1 代码规范配置

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 5.2.2 错误边界组件

```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 上报错误到监控系统
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### 5.2.3 目录结构优化建议

```
shujiaos/
├── src/
│   ├── components/          # 通用UI组件
│   │   ├── common/          # 基础组件 (Button, Input, Modal...)
│   │   ├── layout/          # 布局组件 (PageContainer, Header...)
│   │   └── business/        # 业务组件 (OrderItem, ProductCard...)
│   ├── pages/               # 页面组件
│   ├── hooks/               # 自定义Hooks
│   ├── contexts/            # Context状态管理
│   ├── services/            # API服务
│   │   ├── api.ts           # API封装
│   │   └── modules/         # 按模块拆分的API
│   │       ├── auth.ts
│   │       ├── order.ts
│   │       └── user.ts
│   ├── utils/               # 工具函数
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── storage.ts
│   ├── constants/           # 常量定义
│   │   ├── config.ts
│   │   └── enums.ts
│   ├── types/               # TypeScript类型
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── props.ts
│   ├── assets/              # 静态资源
│   ├── styles/              # 全局样式
│   ├── App.tsx
│   └── main.tsx
├── tests/                   # 测试文件
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
└── vite.config.ts
```

#### 5.2.4 API 模块拆分建议

```typescript
// services/modules/auth.ts
export const authApi = {
  login: (params: LoginParams) => apiFetch('/User/login', { method: 'POST', body: params }),
  register: (params: RegisterParams) => apiFetch('/User/register', { method: 'POST', body: params }),
  logout: () => apiFetch('/User/logout', { method: 'POST' }),
};

// services/modules/order.ts
export const orderApi = {
  getList: (params) => apiFetch('/shopOrder/list', { params }),
  create: (params) => apiFetch('/shopOrder/create', { method: 'POST', body: params }),
  pay: (orderId) => apiFetch('/shopOrder/pay', { method: 'POST', body: { order_id: orderId } }),
  // ...
};

// services/index.ts - 统一导出
export * from './modules/auth';
export * from './modules/order';
export * from './modules/user';
```

#### 5.2.5 环境配置

```typescript
// config/index.ts
interface AppConfig {
  apiBaseUrl: string;
  apiAssetOrigin: string;
  tokenKey: string;
  userInfoKey: string;
}

const config: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  apiAssetOrigin: import.meta.env.VITE_API_ASSET_ORIGIN || 'http://18.166.211.131',
  tokenKey: 'cat_auth_token',
  userInfoKey: 'cat_user_info',
};

export default config;
```

---

## 六、总结

### 优先级建议

| 优先级 | 优化项 | 预计收益 |
|--------|--------|----------|
| P0 (高) | 路由懒加载 | 显著减少首屏加载时间 |
| P0 (高) | 抽取通用UI组件 | 减少代码重复，提高开发效率 |
| P1 (中) | 自定义Hooks抽取 | 提高代码复用性，减少重复逻辑 |
| P1 (中) | 添加ESLint/Prettier | 统一代码风格，减少低级错误 |
| P1 (中) | 错误边界处理 | 提高应用稳定性 |
| P2 (低) | 列表虚拟化 | 优化长列表性能 |
| P2 (低) | 数据缓存 | 减少重复请求，提升用户体验 |
| P2 (低) | 单元测试 | 保证代码质量，减少回归bug |

---

## 版本信息

- **文档版本**: 1.0.0
- **创建日期**: 2024-12-06
- **适用项目版本**: 当前版本
