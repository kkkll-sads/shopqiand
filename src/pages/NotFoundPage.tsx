import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

/**
 * 通用 404 页面
 * - 未匹配路由时展示
 * - 新版本发布后旧缓存导致资源失效时，引导用户刷新
 */
const NotFoundPage = () => {
  const handleRefresh = () => {
    window.location.replace(`${window.location.pathname}?__t=${Date.now()}`);
  };

  const handleGoHome = () => {
    window.location.assign('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base to-bg-card flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/14">
          <AlertTriangle size={36} className="text-red-400 dark:text-red-300" />
        </div>

        <h1 className="mb-2 text-3xl font-bold text-text-main">页面未找到</h1>
        <p className="mb-6 text-sm leading-6 text-text-sub">
          您访问的页面不存在或已失效。
          <br />
          如果刚刚进行了版本更新，请刷新页面以获取最新内容。
        </p>

        <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-left text-sm text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/14 dark:text-orange-200">
          <p className="mb-1 font-medium">可能的原因</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-orange-800 dark:text-orange-200/90">
            <li>页面地址输入有误</li>
            <li>系统已发布新版本，旧页面资源已失效</li>
            <li>网络连接异常</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white active:bg-red-600 transition-colors"
          >
            <RefreshCw size={16} />
            刷新页面
          </button>
          <button
            onClick={handleGoHome}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border-light text-sm font-bold text-text-sub transition-colors active:bg-bg-hover"
          >
            <Home size={16} />
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
