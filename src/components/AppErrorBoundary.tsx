import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  declare props: Props;
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info);

    const isHookError =
      error.message?.includes('queue') ||
      error.message?.includes('Hooks') ||
      error.message?.includes('rendered fewer hooks') ||
      error.message?.includes('rendered more hooks');

    if (isHookError) {
      console.warn('[AppErrorBoundary] detected a hot-reload hook mismatch and will refresh the page.');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="app-min-viewport-height flex flex-col items-center justify-center px-6 text-center"
          style={{
            fontFamily: 'system-ui, sans-serif',
          }}
        >
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

    return this.props.children;
  }
}
