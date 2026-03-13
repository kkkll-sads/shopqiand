/**
 * @file LiveWebView/index.tsx - 直播观看页面
 * @description 通过 iframe 或 video 元素播放直播内容，支持复制链接、浏览器打开、刷新。
 */

import { useEffect, useMemo, useState } from 'react'; // React 核心 Hook
import { useSearchParams } from 'react-router-dom';
import {
  Copy,
  ExternalLink,
  PlayCircle,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';
import { liveVideoApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useRequest } from '../../hooks/useRequest';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';
import { useFeedback } from '../../components/ui/FeedbackProvider';

/** 提取 URL 域名作为显示标签 */
function getDomainLabel(url: string): string {
  try {
    return new URL(url).hostname || '第三方内容';
  } catch {
    return '第三方内容';
  }
}

/** 判断 URL 是否为媒体文件地址 */
function looksLikeMediaUrl(url: string): boolean {
  return /\.(m3u8|mp4|webm|ogg|mov|mpd)(\?|$)/i.test(url);
}

/**
 * LiveWebViewPage - 直播观看页
 * 功能：加载直播流 → iframe/video 播放 → 复制链接 → 浏览器打开 → 刷新
 */
export const LiveWebViewPage = () => {
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();
  const [searchParams] = useSearchParams();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [playerKey, setPlayerKey] = useState(0);

  const queryUrl = searchParams.get('url')?.trim() ?? '';
  const queryTitle = searchParams.get('title')?.trim() ?? '';
  const queryDescription = searchParams.get('description')?.trim() ?? '';
  const hasQueryConfig = queryUrl.length > 0;

  const {
    data,
    error,
    loading,
    reload,
  } = useRequest((signal) => liveVideoApi.getConfig(signal), {
    cacheKey: 'live-video:config',
    manual: hasQueryConfig,
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

  const config = useMemo(
    () =>
      hasQueryConfig
        ? {
            description: queryDescription,
            title: queryTitle,
            videoUrl: queryUrl,
          }
        : data ?? { description: '', title: '', videoUrl: '' },
    [data, hasQueryConfig, queryDescription, queryTitle, queryUrl],
  );

  const title = config.title || '直播详情';
  const description = config.description || '当前直播内容由后台配置提供。';
  const playerUrl = config.videoUrl;
  const domainLabel = useMemo(() => getDomainLabel(playerUrl), [playerUrl]);
  const isMediaUrl = looksLikeMediaUrl(playerUrl);

  useEffect(() => {
    setMediaLoaded(false);
    setPlayerError('');
    setPlayerKey(0);
  }, [playerUrl]);

  const handleRefresh = () => {
    setMediaLoaded(false);
    setPlayerError('');
    setPlayerKey((current) => current + 1);
    if (!hasQueryConfig) {
      void reload().catch(() => undefined);
    }
  };

  const handleCopyLink = async () => {
    if (!playerUrl) {
      return;
    }

    const ok = await copyToClipboard(playerUrl);
    showToast({
      message: ok ? '直播链接已复制' : '复制失败，请稍后重试',
      type: ok ? 'success' : 'error',
    });
  };

  const handleOpenBrowser = () => {
    if (!playerUrl) {
      return;
    }

    window.open(playerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#fff7f0] dark:bg-gray-950">
      <PageHeader
        title="直播"
        onBack={goBack}
        offline={offline}
        onRefresh={handleRefresh}
        className="border-b border-border-light bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90"
        contentClassName="h-12 px-4"
      />

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {loading && !hasQueryConfig ? (
          <div className="space-y-4">
            <div className="h-[220px] animate-pulse rounded-[28px] bg-white dark:bg-gray-900" />
            <div className="h-24 animate-pulse rounded-[24px] bg-white dark:bg-gray-900" />
          </div>
        ) : null}

        {!loading && error && !hasQueryConfig ? (
          <ErrorState
            message={getErrorMessage(error)}
            onRetry={() => {
              void reload().catch(() => undefined);
            }}
          />
        ) : null}

        {!loading && !error && !playerUrl ? (
          <EmptyState
            icon={<PlayCircle size={48} />}
            message="当前暂无可播放的直播地址"
            actionText="重新加载"
            onAction={() => {
              void reload().catch(() => undefined);
            }}
          />
        ) : null}

        {!loading && !error && playerUrl && !playerError ? (
          <div className="space-y-4">
            <section className="rounded-[24px] border border-amber-100 bg-amber-50/90 p-4 text-amber-800 shadow-[0_10px_24px_rgba(180,120,32,0.08)] dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-amber-700 dark:bg-white/10 dark:text-amber-300">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold">当前内容来源 {domainLabel}</div>
                  <div className="mt-1 text-sm leading-6 opacity-85">
                    请确认来源可信。如页面无法正常显示，可尝试使用浏览器打开。
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_18px_44px_rgba(128,82,35,0.12)] dark:border-gray-700/60 dark:bg-gray-900 dark:shadow-[0_22px_48px_rgba(0,0,0,0.36)]">
              <div className="border-b border-border-light px-5 py-4">
                <div className="text-xl font-semibold text-text-main">{title}</div>
                <div className="mt-2 text-sm leading-6 text-text-sub">{description}</div>
              </div>

              <div className="relative bg-black">
                {!mediaLoaded ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 text-white">
                    <RefreshCcw size={22} className="mb-2 animate-spin" />
                    <span className="text-sm">内容加载中...</span>
                  </div>
                ) : null}

                {isMediaUrl ? (
                  <video
                    key={`${playerKey}:${playerUrl}`}
                    src={playerUrl}
                    controls
                    autoPlay
                    playsInline
                    className="aspect-video w-full bg-black"
                    onLoadedData={() => setMediaLoaded(true)}
                    onError={() => setPlayerError('视频加载失败，请稍后重试')}
                  />
                ) : (
                  <iframe
                    key={`${playerKey}:${playerUrl}`}
                    src={playerUrl}
                    title={title}
                    className="aspect-video w-full border-0 bg-white dark:bg-gray-950"
                    referrerPolicy="no-referrer"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                    onLoad={() => setMediaLoaded(true)}
                  />
                )}
              </div>
            </section>

            <section className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex h-12 items-center justify-center rounded-[18px] border border-border-light bg-white text-sm font-medium text-text-main shadow-sm active:bg-bg-base dark:border-gray-700 dark:bg-gray-900 dark:active:bg-gray-800"
              >
                <RefreshCcw size={16} className="mr-2" />
                刷新
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex h-12 items-center justify-center rounded-[18px] border border-border-light bg-white text-sm font-medium text-text-main shadow-sm active:bg-bg-base dark:border-gray-700 dark:bg-gray-900 dark:active:bg-gray-800"
              >
                <Copy size={16} className="mr-2" />
                复制链接
              </button>
              <button
                type="button"
                onClick={handleOpenBrowser}
                className="inline-flex h-12 items-center justify-center rounded-[18px] bg-gradient-to-r from-brand-start to-brand-end text-sm font-medium text-white shadow-[0_10px_24px_rgba(226,35,26,0.22)] active:scale-[0.98]"
              >
                <ExternalLink size={16} className="mr-2" />
                浏览器打开
              </button>
            </section>
          </div>
        ) : null}

        {!loading && !error && playerError ? (
          <ErrorState message={playerError} onRetry={handleRefresh} />
        ) : null}
      </div>
    </div>
  );
};

