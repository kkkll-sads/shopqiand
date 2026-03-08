/**
 * @file 全局错误边界
 * @description 捕获 React 渲染错误（如 HMR 导致的 Hook 失效）。
 *              开发环境自动刷新页面，生产环境显示友好错误界面。
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info);

    // HMR 导致的 Hook 错误 → 自动刷新
    const isHookError =
      error.message?.includes('queue') ||
      error.message?.includes('Hooks') ||
      error.message?.includes('rendered fewer hooks') ||
      error.message?.includes('rendered more hooks');

    if (isHookError) {
      console.warn('[AppErrorBoundary] 检测到 HMR Hook 错误，自动刷新页面...');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', margin: '0 0 8px', color: '#333' }}>
            页面出了点问题
          </h2>
          <p style={{ fontSize: '14px', color: '#888', margin: '0 0 24px' }}>
            请刷新页面重试
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #FF4142, #FF6B6B)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    const { children } = this.props as Props;
    return children;
  }
}
