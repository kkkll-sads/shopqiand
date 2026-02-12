/**
 * errorHelpers.ts - 统一错误处理工具函数（聚合导出）
 */

export { AppError, ErrorSeverity, ErrorType } from './errorHelpers/types';
export { extractErrorMessage } from './errorHelpers/extract';
export { getErrorSeverity, getErrorType } from './errorHelpers/classify';
export {
  createAuthError,
  createBusinessError,
  createNetworkError,
  createValidationError,
} from './errorHelpers/factories';
export { logError, withErrorHandling, wrapError } from './errorHelpers/runtime';
