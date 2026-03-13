/**
 * @file Live/index.tsx - 直播页面
 * @description 展示当前官方直播配置信息，点击进入直播观看页。
 */

import { useEffect, useMemo, useState } from 'react'; // React 核心 Hook
import {
  ExternalLink,
  HeadphonesIcon,
  PlayCircle,
  RefreshCcw,
  WifiOff,
} from 'lucide-react';
import { liveVideoApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { openCustomerServiceLink } from '../../lib/customerService';

/** 提取 URL 域名作为显示标签 */
function getDomainLabel(url: string): string {
  try {
    return new URL(url).hostname || '第三方内容';
  } catch {
    return '第三方内容';
  }
}

/**
 * LivePage - 直播页面
 * 功能：加载直播配置 → 展示标题/描述 → 点击进入观看页
 */
export const LivePage = () => {
  const { goBack, goTo, navigate } = useAppNavigate();
  const { showToast } = useFeedback();
  const [offline, setOffline] = useState(!navigator.onLine);
  const handleOpenSupport = () => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  };

  const {
    data,
    error,
    loading,
    reload,
  } = useRequest((signal) => liveVideoApi.getConfig(signal), {
    cacheKey: 'live-video:config',
  });

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const config = data ?? { description: '', title: '', videoUrl: '' };
  const title = config.title || '官方直播';
  const description = config.description || '查看当前官方直播内容与说明。';
  const domainLabel = useMemo(() => getDomainLabel(config.videoUrl), [config.videoUrl]);

  const handleWatch = () => {
    if (!config.videoUrl) {
      return;
    }

    const params = new URLSearchParams({
      description,
      title,
      url: config.videoUrl,
    });
    navigate(`/live/view?${params.toString()}`);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#fff4ec] dark:bg-gray-950">
      <PageHeader
        title="直播"
        onBack={goBack}
        offline={offline}
        onRefresh={() => {
          void reload().catch(() => undefined);
        }}
        className="border-b border-border-light bg-white/90 shadow-sm backdrop-blur-md dark:bg-bg-card/90"
        contentClassName="h-12 px-4"
        rightAction={
          <button
            type="button"
            onClick={handleOpenSupport}
            className="text-text-sub active:opacity-70"
          >
            <HeadphonesIcon size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {loading && !data ? (
          <div className="space-y-4">
            <div className="h-[220px] animate-pulse rounded-[28px] bg-white dark:bg-gray-900" />
            <div className="h-28 animate-pulse rounded-[24px] bg-white dark:bg-gray-900" />
          </div>
        ) : null}

        {!loading && error ? (
          <ErrorState
            message={getErrorMessage(error)}
            onRetry={() => {
              void reload().catch(() => undefined);
            }}
          />
        ) : null}

        {!loading && !error && !config.videoUrl ? (
          <EmptyState
            icon={<PlayCircle size={48} />}
            message="当前暂无直播内容"
            actionText="重新加载"
            onAction={() => {
              void reload().catch(() => undefined);
            }}
          />
        ) : null}

        {!loading && !error && config.videoUrl ? (
          <div className="space-y-4">
            <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(140deg,#30140f_0%,#8b451e_44%,#ff7a30_100%)] p-5 text-white shadow-[0_22px_50px_rgba(139,69,30,0.24)]">
              <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-[#ffd3b1]/20 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white/80">
                  Live Config
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 backdrop-blur-sm">
                    <PlayCircle size={28} />
                  </div>
                  <div>
                    <div className="inline-flex items-center rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white/80">
                      直播已配置
                    </div>
                    <div className="mt-2 text-sm text-white/72">来源 {domainLabel}</div>
                  </div>
                </div>
                <h2 className="mt-5 text-[30px] font-semibold leading-tight">{title}</h2>
                <p className="mt-3 max-w-[300px] text-sm leading-6 text-white/78">{description}</p>

                <button
                  type="button"
                  onClick={handleWatch}
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#b84f1a] shadow-[0_10px_24px_rgba(0,0,0,0.15)] active:scale-[0.98] dark:bg-gray-900 dark:text-orange-200"
                >
                  立即观看
                  <ExternalLink size={16} className="ml-2" />
                </button>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/70 bg-white/95 p-4 shadow-[0_12px_32px_rgba(143,80,31,0.08)] backdrop-blur dark:border-gray-700/60 dark:bg-gray-900/95 dark:shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-text-main">直播地址</div>
                  <div className="mt-1 break-all text-sm leading-6 text-text-sub">{config.videoUrl}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void reload().catch(() => undefined);
                  }}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-light text-text-sub active:bg-bg-base"
                >
                  <RefreshCcw size={16} />
                </button>
              </div>
            </section>

            {offline ? (
              <div className="flex items-center rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <WifiOff size={16} className="mr-2 shrink-0" />
                当前网络不可用，恢复网络后可继续打开直播。
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

