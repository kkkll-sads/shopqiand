import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * 通用 404 页面
 * - 未匹配路由时展示
 * - 重新构建后旧缓存导致乱码/资源失效时，引导用户刷新
 */
const NotFoundPage = () => {
  const handleRefresh = () => {
    // 强制从服务器拉取最新资源（跳过缓存）
    window.location.replace(window.location.pathname + '?__t=' + Date.now());
  };

  const handleGoHome = () => {
    window.location.assign('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        {/* 图标 */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle size={36} className="text-red-400" />
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-sm text-gray-500 leading-6 mb-6">
          您访问的页面不存在或已失效。
          <br />
          如果刚刚进行了版本更新，请刷新页面以获取最新内容。
        </p>

        {/* 提示卡片 */}
        <div className="rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm text-orange-900 text-left mb-6">
          <p className="font-medium mb-1">📌 可能的原因</p>
          <ul className="space-y-1 text-[13px] text-orange-800 list-disc list-inside">
            <li>页面地址输入有误</li>
            <li>系统已发布新版本，旧页面资源已失效</li>
            <li>网络连接异常</li>
          </ul>
        </div>

        {/* 按钮 */}
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
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 active:bg-gray-50 transition-colors"
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
