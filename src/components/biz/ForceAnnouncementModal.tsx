import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { PopupAnnouncementItem } from '../../api/modules/announcement';

interface ForceAnnouncementModalProps {
  /** 公告数据，空则按 loading 处理 */
  item: PopupAnnouncementItem | null;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否加载失败 */
  error?: boolean;
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 重试加载 */
  onRetry?: () => void;
  /** 查看详情（跳转公告中心） */
  onViewDetail?: () => void;
}

export const ForceAnnouncementModal: React.FC<ForceAnnouncementModalProps> = ({
  item,
  loading = false,
  error = false,
  isOpen,
  onClose,
  onRetry,
  onViewDetail,
}) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 8);
  };

  useEffect(() => {
    if (!loading && !error && item) {
      setTimeout(checkScroll, 100);
    }
  }, [loading, error, item]);

  if (!isOpen) return null;

  const renderSkeleton = () => (
    <div className="p-5 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="w-48 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center h-[40vh]">
      <AlertCircle size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">加载失败</h3>
      <p className="text-base text-gray-500 dark:text-gray-400 mb-6">请检查网络后重试</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-md text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800"
        >
          重新加载
        </button>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (!item) return null;

    return (
      <>
        <div className="px-5 pt-6 pb-3 shrink-0">
          <div className="flex items-start mb-1">
            <span className="bg-[#ffe4e4] dark:bg-red-900/30 text-text-price dark:text-red-400 text-xs px-1.5 py-0.5 rounded-sm font-medium mr-2 shrink-0 border border-red-100 dark:border-red-800/50 mt-1">
              公告
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
              {item.title}
            </h2>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="px-5 overflow-y-auto no-scrollbar flex-1 relative min-h-0"
        >
          <div className="text-md text-gray-700 dark:text-gray-300 leading-relaxed pb-4 whitespace-pre-wrap">
            {item.content || ''}
          </div>
        </div>

        <div className="px-5 shrink-0 pb-4 pt-2 relative">
          {!isScrolledToBottom && (
            <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none animate-bounce">
              <div className="bg-black/60 text-white text-s px-3 py-1.5 rounded-full flex items-center shadow-sm">
                下滑阅读全文 <ChevronDown size={12} className="ml-1" />
              </div>
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-start">
            <AlertCircle size={14} className="text-gray-400 dark:text-gray-500 mr-2 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
              安全提示：请勿轻信非官方渠道信息，保护好个人财产安全。
            </p>
          </div>
        </div>

        <div className="px-5 pb-6 shrink-0 flex flex-col items-center">
          <button
            className={`w-full h-[44px] min-h-[44px] flex items-center justify-center rounded-full text-xl font-medium transition-all shadow-sm shrink-0 ${
              isScrolledToBottom
                ? 'bg-gradient-to-r from-brand-start to-brand-end text-white active:opacity-80'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            onClick={isScrolledToBottom ? onClose : undefined}
            disabled={!isScrolledToBottom}
          >
            {isScrolledToBottom ? '我已阅读并知晓' : '下滑阅读后可确认'}
          </button>

          {onViewDetail && (
            <button
              className="mt-3 text-base text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-300 flex items-center"
              onClick={onViewDetail}
            >
              查看详情 <ChevronRight size={12} className="ml-0.5" />
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="bg-white dark:bg-gray-900 w-full max-w-[340px] rounded-2xl shadow-lg relative z-10 flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="flex-1 overflow-hidden flex flex-col">{renderContent()}</div>
      </div>
    </div>
  );
};
