/**
 * ScrollToTop 组件
 * 在路由变化时自动滚动到页面顶部
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 使用 requestAnimationFrame 确保在 DOM 更新后执行
    requestAnimationFrame(() => {
      // 滚动到页面顶部
      window.scrollTo(0, 0);
      
      // 同时重置可能存在的滚动容器
      const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"], [class*="overflow-auto"]');
      scrollContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          container.scrollTop = 0;
        }
      });
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
