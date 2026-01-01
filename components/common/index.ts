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

// 实名认证提示弹窗组件
export { default as RealNameRequiredModal } from './RealNameRequiredModal';
