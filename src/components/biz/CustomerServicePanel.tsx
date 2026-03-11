import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Loader2, RefreshCcw, X } from 'lucide-react';
import { useFeedback } from '../ui/FeedbackProvider';
import { copyToClipboard } from '../../lib/clipboard';

interface CustomerServicePanelProps {
  isOpen: boolean;
  url: string;
  title?: string;
  isRefreshing?: boolean;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
}

export const CustomerServicePanel = ({
  isOpen,
  url,
  title = '在线客服',
  isRefreshing = false,
  onClose,
  onRefresh,
}: CustomerServicePanelProps) => {
  const { showToast } = useFeedback();
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return;
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => {
      setIsRendered(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && url) {
      setFrameKey((current) => current + 1);
    }
  }, [isOpen, url]);

  if (!isRendered) {
    return null;
  }

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    await onRefresh?.();
    setFrameKey((current) => current + 1);
  };

  const handleCopy = async () => {
    const copied = await copyToClipboard(url);
    showToast({
      message: copied ? '客服链接已复制' : '复制失败，请稍后重试',
      type: copied ? 'success' : 'error',
    });
  };

  const handleOpenBrowser = () => {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      showToast({
        message: '浏览器打开失败，请检查设备设置',
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 px-3 py-4 sm:items-center sm:px-6">
      <button
        type="button"
        aria-label="关闭客服窗口"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div
        className={`relative flex h-[84vh] w-full max-w-[430px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl transition-all duration-200 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[16px] font-medium text-text-main">{title}</div>
            <div className="mt-1 text-[12px] text-text-aux">客服页面以站内悬浮窗打开</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-bg-base text-text-sub active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-border-light px-3 py-2 text-text-sub">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="flex h-9 flex-1 items-center justify-center rounded-2xl bg-bg-base text-[13px] active:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
            <span className="ml-1">刷新</span>
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex h-9 flex-1 items-center justify-center rounded-2xl bg-bg-base text-[13px] active:bg-bg-hover"
          >
            <Copy size={15} />
            <span className="ml-1">复制链接</span>
          </button>
          <button
            type="button"
            onClick={handleOpenBrowser}
            className="flex h-9 flex-1 items-center justify-center rounded-2xl bg-bg-base text-[13px] active:bg-bg-hover"
          >
            <ExternalLink size={15} />
            <span className="ml-1">浏览器打开</span>
          </button>
        </div>

        <div className="relative flex-1 bg-bg-base">
          {url ? (
            <iframe
              key={frameKey}
              title={title}
              src={url}
              className="h-full w-full border-0 bg-white"
              allow="clipboard-read; clipboard-write"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[14px] text-text-sub">
              暂未获取到客服链接，请稍后重试。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
