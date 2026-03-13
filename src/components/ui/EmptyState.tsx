/**
 * @file EmptyState - 统一空数据状态
 * @description 提取自各页面中重复的空状态展示模式：
 *   - 灰色圆形图标区
 *   - 空状态描述文案
 *   - 可选的操作按钮
 * 
 * @example
 * ```tsx
 * <EmptyState icon={<Ticket size={48} />} message="暂无优惠券" />
 * <EmptyState 
 *   icon={<Package size={48} />} 
 *   message="暂无订单" 
 *   actionText="去逛逛"
 *   onAction={() => goTo('store')} 
 * />
 * ```
 */
import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  /** 空状态提示文案 */
  message?: string;
  /** 自定义图标，默认为 Inbox */
  icon?: React.ReactNode;
  /** 操作按钮文案 */
  actionText?: string;
  /** 操作按钮回调 */
  onAction?: () => void;
  /** 按钮样式变体：'primary'=实心红色, 'outline'=描边 */
  actionVariant?: 'primary' | 'outline';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = '暂无数据',
  icon,
  actionText,
  onAction,
  actionVariant = 'outline',
}) => (
  <div className="flex flex-col items-center justify-center pt-32 px-4">
    <div className="w-24 h-24 bg-bg-hover rounded-full flex items-center justify-center mb-4 text-text-aux border border-border-light">
      {icon || <Inbox size={48} />}
    </div>
    <p className="text-lg text-text-sub mb-6">{message}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className={`px-6 py-2 rounded-full text-md font-medium active:opacity-80 ${
          actionVariant === 'primary'
            ? 'bg-primary-start text-white shadow-sm'
            : 'border border-border-main text-text-main bg-bg-card'
        }`}
      >
        {actionText}
      </button>
    )}
  </div>
);
