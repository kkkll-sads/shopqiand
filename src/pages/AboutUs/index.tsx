import { useMemo, useState } from 'react';
import { ChevronRight, Copy } from 'lucide-react';
import { appVersionApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { copyToClipboard } from '../../lib/clipboard';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import {
  APP_BUILD_NUMBER,
  APP_CHANNEL,
  APP_PLATFORM,
  CURRENT_APP_VERSION,
  compareAppVersions,
  formatVersionLabel,
} from '../../lib/appVersion';

const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE?.trim() ?? '';

function openDownloadUrl(downloadUrl: string) {
  const popup = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.assign(downloadUrl);
  }
}

export const AboutUsPage = () => {
  const { isOffline } = useNetworkStatus();
  const { showToast } = useFeedback();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const {
    data: latestVersion,
    error: latestVersionError,
    loading: latestVersionLoading,
    reload: reloadLatestVersion,
    setData: setLatestVersion,
  } = useRequest((signal) => appVersionApi.getLatestVersion({ platform: APP_PLATFORM }, { signal }));

  const appName = latestVersion?.appName ?? '树交所';

  const versionSummary = useMemo(() => {
    if (isCheckingUpdate) {
      return '检查中...';
    }

    if (latestVersionLoading && !latestVersion) {
      return '获取中...';
    }

    if (latestVersionError) {
      return '获取失败';
    }

    if (!latestVersion) {
      return formatVersionLabel(CURRENT_APP_VERSION);
    }

    return compareAppVersions(latestVersion.versionCode, CURRENT_APP_VERSION) > 0
      ? `发现新版本 ${formatVersionLabel(latestVersion.versionCode)}`
      : '已是最新版本';
  }, [isCheckingUpdate, latestVersion, latestVersionError, latestVersionLoading]);

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    showToast({ message: ok ? `已复制 ${text}` : '复制失败，请稍后重试', type: ok ? 'success' : 'error' });
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);

    try {
      const result = await appVersionApi.checkUpdate({
        currentVersion: CURRENT_APP_VERSION,
        platform: APP_PLATFORM,
      });

      if (result.data) {
        setLatestVersion(result.data);
      }

      if (!result.needUpdate) {
        showToast({ message: result.message || '当前已是最新版本', type: 'success' });
        return;
      }

      if (!result.data?.downloadUrl) {
        showToast({ message: result.message || '检测到新版本，但未返回下载地址', type: 'warning' });
        return;
      }

      showToast({
        message: result.message || `发现新版本 ${formatVersionLabel(result.data.versionCode)}`,
        type: 'info',
        duration: 2500,
      });
      openDownloadUrl(result.data.downloadUrl);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#FFF8F8] dark:bg-gray-950">
      <PageHeader
        title="关于我们"
        offline={isOffline}
        onRefresh={() => {
          void reloadLatestVersion().catch(() => undefined);
        }}
        className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
        contentClassName="h-12 px-3 pt-safe"
        titleClassName="text-2xl font-bold text-gray-900 dark:text-gray-100"
        backButtonClassName="text-gray-900 dark:text-gray-100"
      />

      <div className="flex-1 overflow-y-auto px-4 pb-10 no-scrollbar">
        <div className="mb-10 mt-12 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-start to-brand-end shadow-lg">
            <span className="text-4xl font-bold text-white">树</span>
          </div>
          <h2 className="mb-1 text-4xl font-bold text-gray-900 dark:text-gray-100">{appName}</h2>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Version {formatVersionLabel(CURRENT_APP_VERSION)}
          </p>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800"
            onClick={() => {
              void handleCheckUpdate();
            }}
          >
            <span className="text-lg text-gray-900 dark:text-gray-100">检查更新</span>
            <div className="flex items-center">
              <span className="mr-2 text-base text-gray-500 dark:text-gray-400">{versionSummary}</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
          </button>

          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
            <span className="text-lg text-gray-900 dark:text-gray-100">最新版本</span>
            <span className="text-base text-gray-500 dark:text-gray-400">
              {latestVersion ? formatVersionLabel(latestVersion.versionCode) : '--'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 transition-colors active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800">
            <span className="text-lg text-gray-900 dark:text-gray-100">用户协议</span>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 transition-colors active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800">
            <span className="text-lg text-gray-900 dark:text-gray-100">隐私政策</span>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </div>

          {CONTACT_PHONE ? (
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:active:bg-gray-800"
              onClick={() => {
                void handleCopy(CONTACT_PHONE);
              }}
            >
              <span className="text-lg text-gray-900 dark:text-gray-100">联系我们</span>
              <div className="flex items-center">
                <span className="mr-2 text-base text-gray-500 dark:text-gray-400">{CONTACT_PHONE}</span>
                <Copy size={14} className="text-gray-400 dark:text-gray-500" />
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-lg text-gray-900 dark:text-gray-100">联系我们</span>
              <span className="text-base text-gray-500 dark:text-gray-400">--</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col items-center text-sm text-gray-400 dark:text-gray-500">
          <p className="mb-1">Copyright © {new Date().getFullYear()} {appName} All Rights Reserved.</p>
          <div className="flex items-center">
            <span>Channel: {APP_CHANNEL}</span>
            <span className="mx-2">|</span>
            <span>Build: {APP_BUILD_NUMBER}</span>
            <button
              type="button"
              onClick={() => {
                void handleCopy(APP_BUILD_NUMBER);
              }}
              className="ml-1 p-0.5 text-gray-500 transition-colors active:text-gray-700 dark:text-gray-600 dark:active:text-gray-300"
            >
              <Copy size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
