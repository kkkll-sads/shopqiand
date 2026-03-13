/**
 * @file PageHeader - 统一页面顶部导航栏
 */
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { OfflineBanner } from './OfflineBanner';

interface PageHeaderProps {
  /** 页面标题 */
  title: string;
  /** 自定义返回回调，默认使用 goBack() */
  onBack?: () => void;
  /** 右侧操作区内容 */
  rightAction?: ReactNode;
  /** 是否显示离线提示 */
  offline?: boolean;
  /** 离线时刷新按钮的回调 */
  onRefresh?: () => void;
  /** 自定义 className */
  className?: string;
  /** 导航栏区域 className */
  contentClassName?: string;
  /** 标题 className */
  titleClassName?: string;
  /** 返回按钮 className */
  backButtonClassName?: string;
  /** 右侧区域 className */
  rightClassName?: string;
  /** 是否隐藏返回按钮 */
  hideBackButton?: boolean;
}

export const PageHeader = ({
  title,
  onBack,
  rightAction = null,
  offline = false,
  onRefresh = undefined,
  className = '',
  contentClassName = 'h-12 px-3 pt-safe',
  titleClassName = '',
  backButtonClassName = '',
  rightClassName = '',
  hideBackButton = false,
}: PageHeaderProps) => {
  const { goBack } = useAppNavigate();

  const handleBack = onBack || (() => goBack());

  return (
    <div className={`bg-bg-card z-40 relative shrink-0 ${className}`}>
      {offline && <OfflineBanner onAction={onRefresh} className="dark:bg-red-900/20" />}

      <div className={`flex items-center justify-between ${contentClassName}`.trim()}>
        <div className="flex items-center w-1/3">
          {!hideBackButton && (
            <button
              type="button"
              onClick={handleBack}
              className={`p-1 -ml-1 text-text-main active:opacity-70 ${backButtonClassName}`.trim()}
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        <h1 className={`w-1/3 truncate text-center text-2xl font-bold text-text-main ${titleClassName}`.trim()}>
          {title}
        </h1>
        <div className={`flex w-1/3 justify-end ${rightClassName}`.trim()}>
          {rightAction}
        </div>
      </div>
    </div>
  );
};
