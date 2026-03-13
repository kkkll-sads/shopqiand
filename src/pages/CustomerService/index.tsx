import { ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useAppNavigate } from '../../lib/navigation';

function normalizeCustomerServiceUrl(value: string): string {
  if (!value) {
    return '';
  }

  try {
    return new URL(value, window.location.href).toString();
  } catch {
    return '';
  }
}

function getDomainLabel(url: string): string {
  if (!url) {
    return '--';
  }

  try {
    return new URL(url).hostname || '--';
  } catch {
    return '--';
  }
}

export const CustomerServicePage = () => {
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();
  const [searchParams] = useSearchParams();
  const [frameKey, setFrameKey] = useState(0);
  const [isFrameLoading, setIsFrameLoading] = useState(false);

  const rawUrl = searchParams.get('url')?.trim() ?? '';
  const title = searchParams.get('title')?.trim() || '在线客服';
  const url = useMemo(() => normalizeCustomerServiceUrl(rawUrl), [rawUrl]);
  const domainLabel = useMemo(() => getDomainLabel(url), [url]);

  useEffect(() => {
    setFrameKey((current) => current + 1);
    setIsFrameLoading(Boolean(url));
  }, [url]);

  const handleOpenBrowser = () => {
    if (!url) {
      return;
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      showToast({
        message: '浏览器打开失败，请检查设备设置',
        type: 'error',
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#f7f3ec] dark:bg-gray-950">
      <PageHeader
        title={title}
        onBack={goBack}
        rightAction={(
          <button
            type="button"
            onClick={handleOpenBrowser}
            disabled={!url}
            className="inline-flex h-8 items-center justify-center rounded-full border border-[#e6dac8] bg-[#f8f2e8] px-3 text-[11px] font-medium text-[#7d6041] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <ExternalLink size={13} className="mr-1.5" />
            浏览器打开
          </button>
        )}
        className="border-b border-[#eadfce] bg-white/92 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/92"
        contentClassName="h-11 px-4 pt-safe"
        titleClassName="text-base font-semibold"
        backButtonClassName="rounded-full p-1.5 active:bg-black/5 dark:active:bg-white/10"
        rightClassName="items-center"
      />

      <div className="flex items-center justify-between gap-3 border-b border-[#efe5d6] bg-[#fcf8f2] px-4 py-2 text-[11px] text-[#82684d] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        <span className="truncate">当前客服来源：{domainLabel}</span>
        <span className="shrink-0 opacity-75">可返回上一页继续操作</span>
      </div>

      <div className="min-h-0 flex-1 p-3">
        {url ? (
          <div className="relative h-full overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_18px_42px_rgba(84,56,28,0.12)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_20px_48px_rgba(0,0,0,0.32)]">
            {isFrameLoading ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/94 text-text-sub dark:bg-gray-900/94 dark:text-gray-300">
                <Loader2 size={20} className="animate-spin" />
                <div className="text-[13px] font-medium">正在连接客服...</div>
                <div className="text-[11px] opacity-75">如页面空白，可点击右上角用浏览器打开</div>
              </div>
            ) : null}

            <iframe
              key={`${frameKey}:${url}`}
              src={url}
              title={title}
              className="h-full w-full border-0 bg-white dark:bg-gray-950"
              allow="clipboard-read; clipboard-write"
              referrerPolicy="no-referrer"
              onLoad={() => setIsFrameLoading(false)}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              message="暂未获取到客服链接，请稍后重试"
              actionText="返回上一页"
              onAction={goBack}
            />
          </div>
        )}
      </div>
    </div>
  );
};
