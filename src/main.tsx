/**
 * @file 应用入口
 */

import './polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { startAppLifecycleObserver } from './lib/appLifecycle';
import { rewriteLegacyBrowserLocationToHashRoute } from './lib/navigation';
import { initializeClientLogReporting } from './lib/remoteLogReporter';
import { router } from './router';
import './index.css';

rewriteLegacyBrowserLocationToHashRoute();
startAppLifecycleObserver();
initializeClientLogReporting();

if (import.meta.env.DEV || import.meta.env.PROD) {
  requestAnimationFrame(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const vars = [
      '--color-amber-500',
      '--color-orange-500',
      '--color-rose-500',
      '--color-slate-800',
      '--tw-gradient-position',
    ];
    const resolved: Record<string, string> = {};
    vars.forEach((v) => {
      resolved[v] = cs.getPropertyValue(v).trim() || '(empty)';
    });
    console.info('[CSS vars on :root]', resolved);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
