/**
 * 公共组件统一导出文件
 * 
 * 功能说明：
 * - 集中导出所有公共组件，简化导入路径
 * - 使用时只需从 components/common 导入即可
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 * 
 * @example
 * // 使用示例
 * import { LoadingSpinner, EmptyState, ConfirmModal } from '@/components/common';
 */

// 加载状态组件
export { default as LoadingSpinner } from './LoadingSpinner';

// 空状态组件
export { default as EmptyState } from './EmptyState';

// 确认弹窗组件
export { default as ConfirmModal } from './ConfirmModal';

// 结果弹窗组件
export { default as ResultModal } from './ResultModal';

// 内嵌浏览器组件（用于普通网页）
export * from './EmbeddedBrowser';

// 媒体浏览器组件（用于直播/视频）
export { default as MediaBrowser } from './MediaBrowser';

// 支付跳转组件（用于第三方支付）
export { default as PaymentRedirect } from './PaymentRedirect';

// 在线客服组件
export { default as ChatWidget, openChatWidget, closeChatWidget, toggleChatWidget, isChatWidgetOpen } from './ChatWidget';

// 可拖动客服悬浮按钮组件
export { default as DraggableChatButton } from './DraggableChatButton';

// 卡片组件
export { default as Card } from './Card';

// 列表项组件
export { default as ListItem } from './ListItem';

// 懒加载图片组件
export { default as LazyImage } from './LazyImage';

// 错误边界组件
export { default as ErrorBoundary } from './ErrorBoundary';

// 错误回退组件
export { default as ErrorFallback } from './ErrorFallback';

// 地区选择器组件
export { default as RegionPicker } from './RegionPicker';

// 银行选择器组件
export { default as BankPicker } from './BankPicker';

// 版本更新提示弹窗组件
export { default as UpdatePromptModal } from './UpdatePromptModal';

// 搜索输入框组件
export { default as SearchInput } from './SearchInput';

// 下拉选择筛选组件
export { SelectFilter } from './SelectFilter';
export type { SelectOption } from './SelectFilter';

// 排序选择器组件
export { SortSelector } from './SortSelector';
export type { SortOption, SortOrder } from './SortSelector';

// 骨架屏组件系统
export {
  SkeletonBase,
  SkeletonText,
  SkeletonTitle,
  SkeletonCircle,
  SkeletonRect,
  SkeletonProductCard,
  SkeletonTransactionCard,
  SkeletonListItem,
  SkeletonGridCard,
  SkeletonAssetHeader,
  SkeletonSubscriptionCard,
  SkeletonCollectionList,
  SkeletonAssetPage,
  SkeletonHomePage,
  SkeletonProductGrid,
} from './Skeleton';

// 订单详情布局组件
export {
  StatusBanner,
  AmountCard,
  InfoCard,
  InfoRow,
  TimeInfoCard,
} from './OrderDetailLayout';
export type {
  StatusBannerProps,
  AmountCardProps,
  InfoCardProps,
  InfoRowProps,
} from './OrderDetailLayout';

// 订单列表布局组件
export {
  OrderListContainer,
  OrderListHeader,
  OrderListTabs,
  OrderCard,
  OrderListEmpty,
  OrderListFooter,
  OrderListContent,
} from './OrderListLayout';
export type {
  TabItem,
  OrderListHeaderProps,
  OrderListTabsProps,
  OrderCardProps,
  OrderListFooterProps,
} from './OrderListLayout';

// 筛选栏组件
export { FilterBar } from './FilterBar';

// 网格展示组件
export { default as GridShowcase } from './GridShowcase';

// 下拉刷新组件
export { default as PullToRefresh } from './PullToRefresh';

// 滚动到顶部组件
export { default as ScrollToTop, setScrollRestoreInProgress } from './ScrollToTop';
