/**
 * @file PageHeader - 统一页面顶部导航栏
 * @description 提取自各页面中重复的 Header 模式，统一管理：
 *   - 返回按钮（默认调用 goBack）
 *   - 页面标题（居中显示）
 *   - 右侧操作区（可选）
 *   - 离线提示条（可选）
 * 
 * @example
 * ```tsx
 * <PageHeader title="优惠券" />
 * <PageHeader title="设置" rightAction={<button>编辑</button>} />
 * <PageHeader title="订单" onBack={() => goTo('home')} offline={isOffline} onRefresh={refresh} />
 * ```
 */
import React from 'react';
import { ChevronLeft, WifiOff } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';

interface PageHeaderProps {
  /** 页面标题 */
  title: string;
  /** 自定义返回回调，默认使用 goBack() */
  onBack?: () => void;
  /** 右侧操作区内容 */
  rightAction?: React.ReactNode;
  /** 是否显示离线提示 */
  offline?: boolean;
  /** 离线时刷新按钮的回调 */
  onRefresh?: () => void;
  /** 自定义 className */
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  rightAction,
  offline = false,
  onRefresh,
  className = '',
}) => {
  const { goBack } = useAppNavigate();

  const handleBack = onBack || (() => goBack());

  return (
    <div className={`bg-bg-card z-40 relative shrink-0 ${className}`}>
      {/* 离线提示条 */}
      {offline && (
        <div className="bg-red-50 dark:bg-red-900/20 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="font-medium px-2 py-1 bg-bg-card rounded shadow-sm"
            >
              刷新
            </button>
          )}
        </div>
      )}

      {/* 导航栏 */}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button
            onClick={handleBack}
            className="p-1 -ml-1 text-text-main active:opacity-70"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-text-main text-center w-1/3 truncate">
          {title}
        </h1>
        <div className="w-1/3 flex justify-end">
          {rightAction}
        </div>
      </div>
    </div>
  );
};
