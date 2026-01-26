/**
 * ScrollToTop 组件
 * 在路由变化时自动滚动到页面顶部
 * 已优化：支持缓存恢复场景，避免与滚动位置恢复冲突
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 全局标记，用于标识正在恢复滚动位置
const SCROLL_RESTORE_KEY = '__SCROLL_RESTORE_IN_PROGRESS__';

/**
 * 设置滚动恢复标记
 */
export const setScrollRestoreInProgress = (pathname: string, inProgress: boolean) => {
  if (inProgress) {
    sessionStorage.setItem(SCROLL_RESTORE_KEY, pathname);
    // 设置全局标记，防止 ScrollToTop 重置滚动
    (window as any)[SCROLL_RESTORE_KEY] = pathname;
  } else {
    sessionStorage.removeItem(SCROLL_RESTORE_KEY);
    delete (window as any)[SCROLL_RESTORE_KEY];
  }
};

/**
 * 检查是否正在恢复滚动位置
 */
const isScrollRestoreInProgress = (pathname: string): boolean => {
  const stored = sessionStorage.getItem(SCROLL_RESTORE_KEY);
  const global = (window as any)[SCROLL_RESTORE_KEY];
  return stored === pathname || global === pathname;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 如果正在恢复滚动位置，跳过滚动到顶部
    if (isScrollRestoreInProgress(pathname)) {
      return;
    }

    // 使用 requestAnimationFrame 确保在 DOM 更新后执行
    requestAnimationFrame(() => {
      // 再次检查，防止在 rAF 期间标记被设置
      if (isScrollRestoreInProgress(pathname)) {
        return;
      }

      // 滚动到页面顶部
      window.scrollTo(0, 0);
      
      // 同时重置可能存在的滚动容器（但排除正在恢复的容器）
      const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"], [class*="overflow-auto"]');
      scrollContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          // 检查容器是否有 data-scroll-restore 属性
          if (!container.hasAttribute('data-scroll-restore')) {
            container.scrollTop = 0;
          }
        }
      });
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
