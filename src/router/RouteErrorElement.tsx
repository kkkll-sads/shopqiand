import { useEffect, useMemo, useState } from 'react';
import { Home, RefreshCw, TriangleAlert } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ErrorFallback, LoadingSpinner } from '@/components/common';
import {
  getChunkLoadErrorMessage,
  hasRecentChunkLoadRecoveryAttempt,
  isChunkLoadError,
  tryRecoverFromChunkLoad,
} from '@/utils/chunkLoadRecovery';

function normalizeRouteError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (isRouteErrorResponse(error)) {
    const message = error.data && typeof error.data === 'string'
      ? error.data
      : `${error.status} ${error.statusText}`;
    return new Error(message);
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;

    if (typeof record.message === 'string') {
      return new Error(record.message);
    }

    if (typeof record.statusText === 'string') {
      return new Error(record.statusText);
    }
  }

  return new Error('Unexpected route error');
}

const RouteErrorElement = () => {
  const routeError = useRouteError();
  const error = useMemo(() => normalizeRouteError(routeError), [routeError]);
  const chunkError = useMemo(
    () => isChunkLoadError(routeError) || isChunkLoadError(error),
    [error, routeError]
  );
  const [isRecovering, setIsRecovering] = useState(false);
  const [showFallbackButtons, setShowFallbackButtons] = useState(false);
  const hasRetried = hasRecentChunkLoadRecoveryAttempt();

  // 如果自动恢复超过 3 秒仍未完成，显示手动操作按钮
  useEffect(() => {
    if (!isRecovering) return;
    const timer = setTimeout(() => setShowFallbackButtons(true), 3000);
    return () => clearTimeout(timer);
  }, [isRecovering]);

  useEffect(() => {
    if (!chunkError) return;

    const recoveryStarted = tryRecoverFromChunkLoad(routeError);
    if (recoveryStarted) {
      setIsRecovering(true);
    }
  }, [chunkError, routeError]);

  if (!chunkError) {
    return <ErrorFallback error={error} onReset={() => window.location.reload()} />;
  }

  const errorMessage = getChunkLoadErrorMessage(routeError) || getChunkLoadErrorMessage(error);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,118,71,0.16),_transparent_42%),linear-gradient(180deg,_#fff8f3_0%,_#fff_48%,_#fff5ef_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-orange-100 bg-white/95 p-8 shadow-[0_30px_80px_rgba(242,102,45,0.16)] backdrop-blur">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
            {isRecovering ? <RefreshCw className="animate-spin" size={28} /> : <TriangleAlert size={28} />}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            页面已更新
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isRecovering
              ? '检测到页面资源已经切换到新版本，正在为你刷新最新内容。'
              : '刚刚为你自动刷新过一次，但页面资源仍未恢复，请重新加载最新版本。'}
          </p>

          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-4 text-sm text-orange-900">
            {isRecovering ? (
              <div className="flex items-center gap-3">
                <LoadingSpinner />
                <span>正在同步最新页面资源...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p>这通常是因为发布后页面还停留在旧版本，新的懒加载资源文件名已经变更。</p>
                <p>点击下方按钮重新加载即可继续使用。</p>
              </div>
            )}
          </div>

          {(showFallbackButtons || (!isRecovering && hasRetried)) && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-600 active:bg-orange-700"
              >
                <RefreshCw size={18} />
                重新加载最新版本
              </button>
              <button
                onClick={() => window.location.assign('/')}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
              >
                <Home size={18} />
                返回首页
              </button>
            </div>
          )}

          {import.meta.env.DEV && errorMessage && (
            <div className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-left text-xs leading-5 text-slate-200">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteErrorElement;
