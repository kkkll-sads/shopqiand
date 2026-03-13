/**
 * @file ErrorState - 统一错误/加载失败状态
 * @description 提取自各页面中重复的错误展示模式：
 *   - 红色圆形图标区
 *   - 错误描述文案
 *   - 重试按钮
 * 
 * @example
 * ```tsx
 * <ErrorState onRetry={fetchData} />
 * <ErrorState message="网络异常，请稍后重试" onRetry={reload} />
 * ```
 */
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  /** 错误提示文案，默认 "加载失败，请重试" */
  message?: string;
  /** 重试按钮回调 */
  onRetry?: () => void;
  /** 重试按钮文案，默认 "重新加载" */
  retryText?: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = '加载失败，请重试',
  onRetry,
  retryText = '重新加载',
  icon,
}) => (
  <div className="flex flex-col items-center justify-center pt-32 px-4">
    <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-primary-start">
      {icon || <AlertCircle size={48} />}
    </div>
    <p className="text-lg text-text-sub mb-6">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-full bg-primary-start text-white text-md font-medium active:opacity-80 shadow-sm"
      >
        {retryText}
      </button>
    )}
  </div>
);
