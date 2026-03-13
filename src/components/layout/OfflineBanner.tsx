import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  center?: boolean;
  actionClassName?: string;
}

export const OfflineBanner = ({
  message = '网络不稳定，请检查网络设置',
  actionLabel = '刷新',
  onAction,
  className = '',
  center = false,
  actionClassName = '',
}: OfflineBannerProps) => {
  const layoutClassName = onAction ? 'justify-between' : center ? 'justify-center' : 'justify-start';

  return (
    <div
      className={`flex items-center gap-2 bg-red-50 px-4 py-2 text-sm text-primary-start ${layoutClassName} ${className}`.trim()}
    >
      <div className="flex min-w-0 items-center">
        <WifiOff size={14} className="mr-2 shrink-0" />
        <span>{message}</span>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`rounded bg-white px-2 py-1 font-medium shadow-sm dark:bg-gray-900 ${actionClassName}`.trim()}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
