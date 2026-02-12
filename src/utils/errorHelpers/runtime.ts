/**
 * errorHelpers/runtime.ts - 错误包装、日志与高阶处理
 */

import { debugLog, errorLog, warnLog } from '../logger';
import { getErrorSeverity, getErrorType } from './classify';
import { extractErrorMessage } from './extract';
import { AppError, ErrorSeverity } from './types';

/**
 * 包装错误为 AppError
 */
export function wrapError(
  error: any,
  defaultMessage: string = '操作失败，请稍后重试'
): AppError {
  // 已经是 AppError，直接返回
  if (error instanceof AppError) return error;

  const message = extractErrorMessage(error, defaultMessage);
  const type = getErrorType(error);
  const severity = getErrorSeverity(error);

  return new AppError(message, type, severity, {
    originalError: error,
    userMessage: message,
  });
}

/**
 * 记录错误日志
 */
export function logError(error: any, context?: Record<string, any>): void {
  const appError = wrapError(error);
  const logData = {
    ...appError.toLogObject(),
    context: { ...appError.context, ...context },
    timestamp: new Date().toISOString(),
  };

  // 根据严重级别选择日志方法
  if (appError.severity === ErrorSeverity.CRITICAL) {
    errorLog('errorHelpers', '[CRITICAL ERROR]', logData);
  } else if (appError.severity === ErrorSeverity.ERROR) {
    errorLog('errorHelpers', '[ERROR]', logData);
  } else if (appError.severity === ErrorSeverity.WARNING) {
    warnLog('errorHelpers', '[WARNING]', logData);
  } else {
    debugLog('errorHelpers', '[INFO]', logData);
  }

  // TODO: 如果需要上报，调用上报服务
  if (appError.shouldReport) {
    // reportErrorToService(logData);
  }
}

/**
 * 统一错误处理高阶函数
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    onError?: (error: AppError) => void;
    defaultMessage?: string;
    context?: Record<string, any>;
  }
): () => Promise<T | null> {
  return async () => {
    try {
      return await fn();
    } catch (error) {
      const appError = wrapError(error, options?.defaultMessage);
      logError(appError, options?.context);
      options?.onError?.(appError);
      return null;
    }
  };
}
