/**
 * errorHelpers/factories.ts - AppError 工厂函数
 */

import { AppError, ErrorSeverity, ErrorType } from './types';

/**
 * 创建验证错误
 */
export function createValidationError(
  message: string,
  context?: Record<string, any>
): AppError {
  return new AppError(message, ErrorType.VALIDATION, ErrorSeverity.WARNING, {
    context,
    shouldReport: false,
    userMessage: message,
  });
}

/**
 * 创建网络错误
 */
export function createNetworkError(
  message: string = '网络连接失败，请检查网络后重试',
  originalError?: any
): AppError {
  return new AppError(message, ErrorType.NETWORK, ErrorSeverity.ERROR, {
    originalError,
    shouldReport: false,
    userMessage: message,
  });
}

/**
 * 创建业务错误
 */
export function createBusinessError(
  message: string,
  context?: Record<string, any>
): AppError {
  return new AppError(message, ErrorType.BUSINESS, ErrorSeverity.WARNING, {
    context,
    shouldReport: false,
    userMessage: message,
  });
}

/**
 * 创建认证错误
 */
export function createAuthError(message: string = '登录已过期，请重新登录'): AppError {
  return new AppError(message, ErrorType.AUTH, ErrorSeverity.ERROR, {
    shouldReport: false,
    userMessage: message,
  });
}
