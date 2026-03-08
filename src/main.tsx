/**
 * @file 应用入口
 * @description 使用 RouterProvider 替代直接渲染 App 组件，
 *              由 React Router 接管路由控制。
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { router } from './router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ThemeProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
);

