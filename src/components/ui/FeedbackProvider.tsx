import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Info, AlertCircle, CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';

// --- Types ---
export interface NoticeBarOptions {
  message: React.ReactNode;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number; // 0 means no auto-dismiss
  actionText?: string;
  onAction?: () => void;
  closable?: boolean;
  onClick?: () => void;
}

export interface ToastOptions {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

export interface LoadingHUDOptions {
  message?: React.ReactNode;
  subMessage?: React.ReactNode;
  timeout?: number; // default 15000
  onCancel?: () => void;
  cancelable?: boolean;
}

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface FeedbackContextType {
  showNoticeBar: (options: NoticeBarOptions) => void;
  hideNoticeBar: () => void;
  showToast: (options: ToastOptions | string) => void;
  showLoading: (options?: LoadingHUDOptions | string) => void;
  hideLoading: () => void;
  showConfirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- NoticeBar State ---
  const [noticeBar, setNoticeBar] = useState<NoticeBarOptions | null>(null);
  const noticeBarTimerRef = useRef<NodeJS.Timeout>();

  // --- Toast State ---
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout>();

  // --- LoadingHUD State ---
  const [loading, setLoading] = useState<LoadingHUDOptions | null>(null);
  const [loadingTimeoutReached, setLoadingTimeoutReached] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout>();
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);
  const confirmResolverRef = useRef<((result: boolean) => void) | null>(null);

  // --- NoticeBar Methods ---
  const showNoticeBar = useCallback((options: NoticeBarOptions) => {
    setNoticeBar(options);
    if (noticeBarTimerRef.current) clearTimeout(noticeBarTimerRef.current);
    
    const duration = options.duration !== undefined ? options.duration : 6000;
    if (duration > 0) {
      noticeBarTimerRef.current = setTimeout(() => {
        setNoticeBar(null);
      }, duration);
    }
  }, []);

  const hideNoticeBar = useCallback(() => {
    setNoticeBar(null);
    if (noticeBarTimerRef.current) clearTimeout(noticeBarTimerRef.current);
  }, []);

  // --- Toast Methods ---
  const showToast = useCallback((options: ToastOptions | string) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    setToast(opts);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    
    let duration = opts.duration;
    if (duration === undefined) {
      duration = (opts.type === 'error' || opts.type === 'warning') ? 3000 : 2000;
    }
    
    if (duration > 0) {
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    }
  }, []);

  // --- LoadingHUD Methods ---
  const showLoading = useCallback((options?: LoadingHUDOptions | string) => {
    const opts = typeof options === 'string' ? { message: options } : (options || {});
    setLoading({ message: '加载中...', ...opts });
    setLoadingTimeoutReached(false);
    
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    
    const timeout = opts.timeout || 15000;
    loadingTimerRef.current = setTimeout(() => {
      setLoadingTimeoutReached(true);
    }, timeout);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(null);
    setLoadingTimeoutReached(false);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
  }, []);

  const resolveConfirm = useCallback((result: boolean) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
    setConfirm(null);
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions | string) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    setConfirm({
      title: '提示',
      confirmText: '确定',
      cancelText: '取消',
      ...opts,
    });

    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  // --- Renderers ---
  const renderNoticeBar = () => {
    if (!noticeBar) return null;
    
    const icons = {
      info: <Info size={16} className="text-blue-500 shrink-0" />,
      warning: <AlertCircle size={16} className="text-orange-500 shrink-0" />,
      error: <XCircle size={16} className="text-text-price shrink-0" />,
      success: <CheckCircle2 size={16} className="text-green-500 shrink-0" />
    };

    return (
      <div className="fixed top-safe pt-2 left-4 right-4 z-[100] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
        <div 
          className="bg-gray-100 dark:bg-gray-800 rounded-xl min-h-[40px] px-3 py-2 flex items-center shadow-sm pointer-events-auto"
          onClick={noticeBar.onClick}
        >
          {icons[noticeBar.type || 'info']}
          <div className="flex-1 truncate text-base text-gray-800 dark:text-gray-200 mx-2">
            {noticeBar.message}
          </div>
          {noticeBar.actionText && (
            <button 
              className="text-base text-text-price shrink-0 mr-3 font-medium active:opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                if (noticeBar.onAction) noticeBar.onAction();
              }}
            >
              {noticeBar.actionText}
            </button>
          )}
          {noticeBar.closable !== false && (
            <button 
              className="shrink-0 text-gray-400 active:text-gray-600 dark:active:text-gray-300 p-1 -mr-1"
              onClick={(e) => {
                e.stopPropagation();
                hideNoticeBar();
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderToast = () => {
    if (!toast) return null;

    const icons = {
      info: <Info size={16} className="mr-1.5 shrink-0" />,
      success: <CheckCircle2 size={16} className="mr-1.5 shrink-0 text-green-400" />,
      error: <AlertCircle size={16} className="mr-1.5 shrink-0 text-red-400" />,
      warning: <AlertCircle size={16} className="mr-1.5 shrink-0 text-orange-400" />
    };

    return (
      <div className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none w-full px-8 flex justify-center">
        <div className="bg-gray-900/90 dark:bg-gray-800/95 text-white px-4 py-2.5 rounded-2xl flex items-center shadow-sm max-w-full">
          {toast.type && icons[toast.type]}
          <span className="text-md leading-snug line-clamp-2 text-center break-words">
            {toast.message}
          </span>
        </div>
      </div>
    );
  };

  const renderLoadingHUD = () => {
    if (!loading) return null;

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 transition-opacity"></div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col items-center min-w-[120px] max-w-[240px] relative z-10 shadow-lg animate-in zoom-in-95 duration-200">
          {loading.cancelable && (
            <button 
              className="absolute top-3 right-3 text-gray-400 active:text-gray-600"
              onClick={() => {
                if (loading.onCancel) loading.onCancel();
                hideLoading();
              }}
            >
              <X size={16} />
            </button>
          )}
          
          <Loader2 className="w-8 h-8 text-text-price animate-spin mb-3" />
          
          <div className="text-md text-gray-800 dark:text-gray-200 font-medium text-center">
            {loadingTimeoutReached ? '仍在处理中' : loading.message}
          </div>
          
          {loading.subMessage && !loadingTimeoutReached && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center leading-tight">
              {loading.subMessage}
            </div>
          )}

          {loadingTimeoutReached && (
            <div className="mt-4 flex flex-col w-full space-y-2.5">
              <button 
                className="w-full h-[36px] rounded-full border border-[#f2270c] text-text-price text-base font-medium active:bg-red-50 dark:active:bg-red-900/20"
                onClick={() => {
                  setLoadingTimeoutReached(false);
                  // Reset timeout
                  if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
                  loadingTimerRef.current = setTimeout(() => {
                    setLoadingTimeoutReached(true);
                  }, loading.timeout || 15000);
                }}
              >
                继续等待
              </button>
              {loading.onCancel && (
                <button 
                  className="w-full h-[36px] rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-base font-medium active:bg-gray-50 dark:active:bg-gray-700"
                  onClick={() => {
                    loading.onCancel!();
                    hideLoading();
                  }}
                >
                  取消
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConfirmDialog = () => {
    if (!confirm) return null;

    return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center px-6">
        <button
          type="button"
          aria-label="关闭确认弹窗"
          className="absolute inset-0 bg-black/45"
          onClick={() => resolveConfirm(false)}
        />
        <div className="relative z-10 w-full max-w-[320px] overflow-hidden rounded-[24px] bg-white shadow-xl dark:bg-gray-800">
          <div className="px-5 pb-4 pt-5 text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {confirm.title}
            </div>
            <div className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-300">
              {confirm.message}
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              className="h-12 text-base font-medium text-gray-500 transition-colors active:bg-gray-50 dark:text-gray-300 dark:active:bg-gray-700"
              onClick={() => resolveConfirm(false)}
            >
              {confirm.cancelText}
            </button>
            <button
              type="button"
              className={`h-12 border-l border-gray-100 text-base font-semibold transition-colors active:opacity-80 dark:border-gray-700 ${
                confirm.danger ? 'text-red-500' : 'text-[#f2270c]'
              }`}
              onClick={() => resolveConfirm(true)}
            >
              {confirm.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    return () => {
      if (confirmResolverRef.current) {
        confirmResolverRef.current(false);
        confirmResolverRef.current = null;
      }
    };
  }, []);

  return (
    <FeedbackContext.Provider value={{ showNoticeBar, hideNoticeBar, showToast, showLoading, hideLoading, showConfirm }}>
      {children}
      {renderNoticeBar()}
      {renderToast()}
      {renderLoadingHUD()}
      {renderConfirmDialog()}
    </FeedbackContext.Provider>
  );
};
