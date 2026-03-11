/**
 * @file NotFound/index.tsx - 404 页面未找到
 * @description 当用户访问不存在的路由时展示的 404 错误页面。
 */

import React from 'react'; // React 核心
import { Home } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAppNavigate } from '../../lib/navigation';

export const NotFoundPage = () => {
  const { goTo, goBack } = useAppNavigate();

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden h-full min-h-screen">
      <PageHeader title="找不到页面" onBack={goBack} />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-primary-start/20 mb-6">
          <svg
            className="w-32 h-32 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-text-main mb-3">404</h2>
        <p className="text-text-sub text-base mb-8">
          抱歉，您访问的页面不存在或已被移除
        </p>

        <button
          onClick={() => goTo('/')}
          className="flex items-center justify-center px-8 py-3 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white font-medium active:opacity-80 transition-opacity shadow-sm"
        >
          <Home size={18} className="mr-2" />
          返回首页
        </button>
      </div>
    </div>
  );
};
