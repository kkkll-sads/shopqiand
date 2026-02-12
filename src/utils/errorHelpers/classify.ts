/**
 * errorHelpers/classify.ts - 错误分类与严重级别判断
 */

import { AppError, ErrorSeverity, ErrorType } from './types';

/**
 * 判断错误类型
 */
export function getErrorType(error: any): ErrorType {
  if (!error) return ErrorType.SYSTEM;

  // AppError
  if (error instanceof AppError) return error.type;

  // CORS 错误
  if (error.isCorsError || error.name === 'NetworkError') {
    return ErrorType.NETWORK;
  }

  // 网络超时
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return ErrorType.NETWORK;
  }

  // 401/403 认证错误
  if (error.status === 401 || error.status === 403 || error.code === 401 || error.code === 403) {
    return ErrorType.AUTH;
  }

  // 400 验证错误
  if (error.status === 400 || error.code === 400) {
    return ErrorType.VALIDATION;
  }

  // API 业务错误（code !== 0 && code !== 1）
  if (typeof error.code === 'number' && error.code !== 0 && error.code !== 1) {
    return ErrorType.BUSINESS;
  }

  return ErrorType.SYSTEM;
}

/**
 * 判断错误严重级别
 */
export function getErrorSeverity(error: any): ErrorSeverity {
  if (!error) return ErrorSeverity.ERROR;

  // AppError
  if (error instanceof AppError) return error.severity;

  const type = getErrorType(error);

  // 验证错误通常是警告级别
  if (type === ErrorType.VALIDATION) return ErrorSeverity.WARNING;

  // 认证错误通常是错误级别
  if (type === ErrorType.AUTH) return ErrorSeverity.ERROR;

  // 网络错误通常是错误级别
  if (type === ErrorType.NETWORK) return ErrorSeverity.ERROR;

  // 业务错误通常是警告级别
  if (type === ErrorType.BUSINESS) return ErrorSeverity.WARNING;

  // 系统错误默认是错误级别
  return ErrorSeverity.ERROR;
}
