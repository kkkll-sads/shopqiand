/**
 * useErrorHandler.ts - 统一错误处理 Hook
 *
 * 目标：
 * 1. 统一错误状态管理（显示/隐藏错误）
 * 2. 统一错误通知（Toast 提示）
 * 3. 统一错误日志记录
 * 4. 自动错误清除（页面切换/表单重置）
 *
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNotification } from '../context/NotificationContext';
import {
  AppError,
  ErrorType,
  ErrorSeverity,
  extractErrorMessage,
  wrapError,
  logError,
} from '../utils/errorHelpers';

/**
 * 错误处理配置选项
 */
export interface ErrorHandlerOptions {
  /** 是否显示 Toast 通知（默认 true） */
  showToast?: boolean;
  /** 是否持久化错误状态（默认 false） */
  persist?: boolean;
  /** 是否记录错误日志（默认 true） */
  logError?: boolean;
  /** 错误上下文信息 */
  context?: Record<string, any>;
  /** 自定义 Toast 标题 */
  toastTitle?: string;
  /** 自定义错误消息（覆盖提取的消息） */
  customMessage?: string;
}

/**
 * useErrorHandler 返回值
 */
export interface UseErrorHandlerReturn {
  /** 当前错误对象 */
  error: AppError | null;
  /** 错误消息（用户友好） */
  errorMessage: string | null;
  /** 是否有错误 */
  hasError: boolean;
  /** 错误类型 */
  errorType: ErrorType | null;
  /** 错误严重级别 */
  errorSeverity: ErrorSeverity | null;

  /** 处理错误 */
  handleError: (error: any, options?: ErrorHandlerOptions) => void;
  /** 清除错误 */
  clearError: () => void;
  /** 处理异步操作并自动捕获错误 */
  withErrorHandling: <T>(
    fn: () => Promise<T>,
    options?: ErrorHandlerOptions
  ) => Promise<T | null>;
}

/**
 * 统一错误处理 Hook
 *
 * @param defaultOptions - 默认配置选项
 * @returns 错误处理相关方法和状态
 *
 * @example
 * ```typescript
 * // 基础用法
 * const { error, handleError, clearError } = useErrorHandler();
 *
 * const submitForm = async () => {
 *   try {
 *     await api.submit(data);
 *   } catch (err) {
 *     handleError(err, { showToast: true, persist: true });
 *   }
 * };
 *
 * // 使用 withErrorHandling 简化
 * const { withErrorHandling } = useErrorHandler();
 *
 * const submitForm = withErrorHandling(
 *   () => api.submit(data),
 *   { toastTitle: '提交失败' }
 * );
 * ```
 */
export function useErrorHandler(
  defaultOptions?: ErrorHandlerOptions
): UseErrorHandlerReturn {
  const { showToast } = useNotification();
  const [error, setError] = useState<AppError | null>(null);
  const defaultOptionsRef = useRef(defaultOptions);

  // 更新 defaultOptions ref
  useEffect(() => {
    defaultOptionsRef.current = defaultOptions;
  }, [defaultOptions]);

  /**
   * 处理错误
   */
  const handleError = useCallback(
    (err: any, options?: ErrorHandlerOptions) => {
      if (!err) return;

      // 合并默认配置和传入配置
      const mergedOptions = {
        showToast: true,
        persist: false,
        logError: true,
        ...defaultOptionsRef.current,
        ...options,
      };

      // 包装为 AppError
      const appError = wrapError(
        err,
        mergedOptions.customMessage || '操作失败，请稍后重试'
      );

      // 记录错误日志
      if (mergedOptions.logError) {
        logError(appError, mergedOptions.context);
      }

      // 显示 Toast 通知
      if (mergedOptions.showToast) {
        const toastType = getToastType(appError.severity);
        const toastTitle = mergedOptions.toastTitle || getToastTitle(appError.type);
        showToast(toastType, toastTitle, appError.userMessage);
      }

      // 持久化错误状态
      if (mergedOptions.persist) {
        setError(appError);
      }
    },
    [showToast]
  );

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 处理异步操作并自动捕获错误
   */
  const withErrorHandling = useCallback(
    <T>(fn: () => Promise<T>, options?: ErrorHandlerOptions): Promise<T | null> => {
      return (async () => {
        try {
          const result = await fn();
          // 成功时清除错误
          if (options?.persist !== false) {
            clearError();
          }
          return result;
        } catch (err) {
          handleError(err, options);
          return null;
        }
      })();
    },
    [handleError, clearError]
  );

  return {
    error,
    errorMessage: error?.userMessage || null,
    hasError: error !== null,
    errorType: error?.type || null,
    errorSeverity: error?.severity || null,
    handleError,
    clearError,
    withErrorHandling,
  };
}

/**
 * 根据错误严重级别获取 Toast 类型
 */
function getToastType(severity: ErrorSeverity): 'success' | 'error' | 'warning' | 'info' {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'info';
    case ErrorSeverity.WARNING:
      return 'warning';
    case ErrorSeverity.ERROR:
    case ErrorSeverity.CRITICAL:
      return 'error';
    default:
      return 'error';
  }
}

/**
 * 根据错误类型获取 Toast 标题
 */
function getToastTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.VALIDATION:
      return '输入错误';
    case ErrorType.NETWORK:
      return '网络错误';
    case ErrorType.BUSINESS:
      return '操作失败';
    case ErrorType.AUTH:
      return '认证失败';
    case ErrorType.SYSTEM:
    default:
      return '系统错误';
  }
}

/**
 * useErrorBoundary - 用于组件级错误边界
 *
 * @returns 错误边界状态和重置方法
 *
 * @example
 * ```typescript
 * const { error, resetError } = useErrorBoundary();
 *
 * if (error) {
 *   return <ErrorFallback error={error} onReset={resetError} />;
 * }
 *
 * return <YourComponent />;
 * ```
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
      event.preventDefault();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return { error, resetError };
}

export default useErrorHandler;
