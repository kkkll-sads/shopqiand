/**
 * @file AboutUs/index.tsx - 关于我们页面
 * @description 展示应用基本信息（名称、版本、渠道、构建号），
 *              提供检查更新、用户协议、隐私政策入口以及联系电话复制功能。
 */

// ======================== 依赖导入 ========================

import { useMemo, useState } from 'react'; // React 核心 Hook
import { ChevronRight, Copy } from 'lucide-react'; // 图标组件：右箭头 & 复制
import { useNavigate } from 'react-router-dom'; // 路由跳转 Hook
import { appVersionApi } from '../../api'; // 应用版本相关 API
import { getErrorMessage } from '../../api/core/errors'; // 统一错误信息提取
import { PageHeader } from '../../components/layout/PageHeader'; // 页面通用顶部导航栏组件
import { copyToClipboard } from '../../lib/clipboard'; // 剪贴板复制工具函数
import { useFeedback } from '../../components/ui/FeedbackProvider'; // 全局 Toast 反馈 Hook
import { useNetworkStatus } from '../../hooks/useNetworkStatus'; // 网络状态检测 Hook
import { useRequest } from '../../hooks/useRequest'; // 通用异步请求 Hook
import {
  APP_BUILD_NUMBER, // 当前构建号
  APP_CHANNEL, // 当前渠道标识
  APP_PLATFORM, // 当前平台标识（如 android / ios）
  CURRENT_APP_VERSION, // 当前应用版本号
  compareAppVersions, // 版本号比较函数（返回 >0 表示前者更新）
  formatVersionLabel, // 将版本号格式化为可读标签
} from '../../lib/appVersion';

// ======================== 常量 ========================

/** 从环境变量中读取客服联系电话，未配置时为空字符串 */
const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE?.trim() ?? '';

// ======================== 工具函数 ========================

/**
 * 打开下载链接
 * 优先尝试在新标签页中打开；若被浏览器拦截（popup 为 null），则在当前页面跳转
 * @param downloadUrl - 新版本下载地址
 */
function openDownloadUrl(downloadUrl: string) {
  const popup = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.assign(downloadUrl);
  }
}

// ======================== 页面组件 ========================

/**
 * AboutUsPage - "关于我们"页面组件
 *
 * 功能概览：
 * 1. 显示应用 Logo、名称、当前版本号
 * 2. 检查更新：请求后端获取最新版本，若有新版则提示并打开下载链接
 * 3. 展示最新版本号
 * 4. 跳转用户协议 / 隐私政策页面
 * 5. 显示客服电话并支持一键复制
 * 6. 底部展示版权信息、渠道号、构建号
 */
export const AboutUsPage = () => {
  // ---------- 路由 & 全局状态 ----------
  const navigate = useNavigate(); // 页面跳转
  const { isOffline } = useNetworkStatus(); // 当前是否离线
  const { showToast } = useFeedback(); // 全局 Toast 提示
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false); // 是否正在手动检查更新

  // ---------- 获取最新版本信息（页面加载时自动请求） ----------
  const {
    data: latestVersion, // 最新版本数据
    error: latestVersionError, // 请求错误
    loading: latestVersionLoading, // 是否正在加载
    reload: reloadLatestVersion, // 手动重新请求
    setData: setLatestVersion, // 手动更新数据（用于检查更新后同步）
  } = useRequest((signal) => appVersionApi.getLatestVersion({ platform: APP_PLATFORM }, { signal }));

  /** 应用名称：优先取接口返回值，回退默认值"树交所" */
  const appName = latestVersion?.appName ?? '树交所';

  // ---------- 版本摘要文案（根据当前状态动态计算） ----------
  const versionSummary = useMemo(() => {
    // 正在手动检查更新
    if (isCheckingUpdate) {
      return '检查中...';
    }
    // 初次加载中（尚无缓存数据）
    if (latestVersionLoading && !latestVersion) {
      return '获取中...';
    }
    // 请求失败
    if (latestVersionError) {
      return '获取失败';
    }
    // 无数据时显示当前版本号
    if (!latestVersion) {
      return formatVersionLabel(CURRENT_APP_VERSION);
    }
    // 有数据时：与当前版本比较，提示"发现新版本"或"已是最新版本"
    return compareAppVersions(latestVersion.versionCode, CURRENT_APP_VERSION) > 0
      ? `发现新版本 ${formatVersionLabel(latestVersion.versionCode)}`
      : '已是最新版本';
  }, [isCheckingUpdate, latestVersion, latestVersionError, latestVersionLoading]);

  // ---------- 事件处理函数 ----------

  /**
   * 复制文本到剪贴板，并通过 Toast 提示结果
   * @param text - 要复制的文本内容
   */
  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    showToast({ message: ok ? `已复制 ${text}` : '复制失败，请稍后重试', type: ok ? 'success' : 'error' });
  };

  /**
   * 手动检查更新
   * 流程：调用 checkUpdate 接口 → 更新本地版本数据 → 根据结果给出提示或打开下载链接
   */
  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);

    try {
      // 调用检查更新接口
      const result = await appVersionApi.checkUpdate({
        currentVersion: CURRENT_APP_VERSION,
        platform: APP_PLATFORM,
      });

      // 若返回了新版本数据，同步到本地状态
      if (result.data) {
        setLatestVersion(result.data);
      }

      // 无需更新 → 提示已是最新
      if (!result.needUpdate) {
        showToast({ message: result.message || '当前已是最新版本', type: 'success' });
        return;
      }

      // 需要更新但缺少下载地址 → 给出警告
      if (!result.data?.downloadUrl) {
        showToast({ message: result.message || '检测到新版本，但未返回下载地址', type: 'warning' });
        return;
      }

      // 有新版本且有下载地址 → 提示并打开下载
      showToast({
        message: result.message || `发现新版本 ${formatVersionLabel(result.data.versionCode)}`,
        type: 'info',
        duration: 2500,
      });
      openDownloadUrl(result.data.downloadUrl);
    } catch (error) {
      // 请求异常 → 展示错误信息
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // ======================== JSX 渲染 ========================
  return (
    // 页面最外层容器：全屏布局，浅粉色背景 / 暗黑模式深色背景
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#FFF8F8] dark:bg-gray-950">

      {/* -------- 顶部导航栏 -------- */}
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

      {/* -------- 可滚动内容区域 -------- */}
      <div className="flex-1 overflow-y-auto px-4 pb-10 no-scrollbar">

        {/* ======== 应用信息区：Logo + 名称 + 版本号 ======== */}
        <div className="mb-10 mt-12 flex flex-col items-center">
          {/* 应用 Logo：品牌渐变背景 + "树"字 */}
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-start to-brand-end shadow-lg">
            <span className="text-4xl font-bold text-white">树</span>
          </div>
          {/* 应用名称 */}
          <h2 className="mb-1 text-4xl font-bold text-gray-900 dark:text-gray-100">{appName}</h2>
          {/* 当前版本号 */}
          <p className="text-base text-gray-500 dark:text-gray-400">
            Version {formatVersionLabel(CURRENT_APP_VERSION)}
          </p>
        </div>

        {/* ======== 功能列表卡片 ======== */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">

          {/* --- 检查更新 --- */}
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800"
            onClick={() => {
              void handleCheckUpdate();
            }}
          >
            <span className="text-lg text-gray-900 dark:text-gray-100">检查更新</span>
            <div className="flex items-center">
              {/* 右侧显示版本摘要文案 */}
              <span className="mr-2 text-base text-gray-500 dark:text-gray-400">{versionSummary}</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
          </button>

          {/* --- 最新版本（纯展示，不可点击） --- */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
            <span className="text-lg text-gray-900 dark:text-gray-100">最新版本</span>
            <span className="text-base text-gray-500 dark:text-gray-400">
              {latestVersion ? formatVersionLabel(latestVersion.versionCode) : '--'}
            </span>
          </div>

          {/* --- 用户协议（跳转 /user_agreement） --- */}
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800"
            onClick={() => navigate('/user_agreement')}
          >
            <span className="text-lg text-gray-900 dark:text-gray-100">用户协议</span>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </button>

          {/* --- 隐私政策（跳转 /privacy_policy） --- */}
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800"
            onClick={() => navigate('/privacy_policy')}
          >
            <span className="text-lg text-gray-900 dark:text-gray-100">隐私政策</span>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </button>

          {/* --- 联系我们：有电话则显示电话+复制按钮，无电话则显示占位符 --- */}
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
            // 未配置联系电话时的占位展示
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-lg text-gray-900 dark:text-gray-100">联系我们</span>
              <span className="text-base text-gray-500 dark:text-gray-400">--</span>
            </div>
          )}
        </div>

        {/* ======== 页面底部：版权 & 构建信息 ======== */}
        <div className="mt-auto flex flex-col items-center text-sm text-gray-400 dark:text-gray-500">
          {/* 版权声明 */}
          <p className="mb-1">Copyright © {new Date().getFullYear()} {appName} All Rights Reserved.</p>
          {/* 渠道号 & 构建号（构建号支持一键复制） */}
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
