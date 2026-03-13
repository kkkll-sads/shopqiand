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
import { router } from './router';
import './index.css';

rewriteLegacyBrowserLocationToHashRoute();
startAppLifecycleObserver();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
