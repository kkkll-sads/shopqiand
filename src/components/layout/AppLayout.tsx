/**
 * @file AppLayout - 应用根布局组件
 * @description 从 App.tsx 中提取的布局骨架，包含：
 *   - 外层容器（全屏高度、背景色）
 *   - FeedbackProvider（全局反馈 UI）
 *   - 暗色模式切换按钮
 *   - React Router <Outlet /> 渲染子路由
 *   - 底部 Tab 导航栏（仅在 Tab 页显示）
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { BottomTab } from './BottomTab';
import { FeedbackProvider } from '../ui/FeedbackProvider';
import { isTabPage, PATH_TO_TAB } from '../../lib/navigation';

export const AppLayout = () => {
  const { theme, setTheme, isDark } = useTheme();
  const location = useLocation();
  
  // 根据当前路径判断是否显示底部 Tab
  const showBottomTab = isTabPage(location.pathname);
  // 获取当前 Tab 的 ID（用于高亮）
  const activeTab = PATH_TO_TAB[location.pathname] || 'home';

  return (
    <FeedbackProvider>
      <div className="h-[100dvh] w-full bg-bg-base flex flex-col overflow-hidden">
        {/* 悬浮暗色模式切换按钮 */}
        <button
          className={`fixed ${showBottomTab ? 'bottom-24' : 'bottom-6'} right-4 z-50 p-3 rounded-full bg-bg-card shadow-lg border border-border-light text-text-main transition-all`}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* 主内容区域 */}
        <div className="relative flex flex-1 w-full flex-col overflow-hidden bg-bg-base sm:mx-auto sm:max-w-[430px] sm:shadow-2xl">
          <div className="flex-1 relative flex flex-col overflow-hidden">
            {/* React Router 子路由出口 */}
            <Outlet />
          </div>
          
          {/* 底部 Tab 导航栏 - 仅在 Tab 页显示 */}
          {showBottomTab && <BottomTab active={activeTab} />}
        </div>
      </div>
    </FeedbackProvider>
  );
};
