/**
 * errorHelpers.ts - 统一错误处理工具函数
 *
 * 目标：
 * 1. 标准化错误对象结构
 * 2. 统一错误消息提取逻辑
 * 3. 区分错误类型（验证错误、网络错误、业务错误）
 * 4. 提供错误日志记录
 *
 * @author 树交所前端团队
 * @version 1.0.0
 */

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** 验证错误（用户输入不合法） */
  VALIDATION = 'validation',
  /** 网络错误（请求失败、超时） */
  NETWORK = 'network',
  /** 业务错误（API返回失败状态） */
  BUSINESS = 'business',
  /** 系统错误（代码异常、未知错误） */
  SYSTEM = 'system',
  /** 认证错误（未登录、token过期） */
  AUTH = 'auth',
}

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  /** 信息提示（不影响流程） */
  INFO = 'info',
  /** 警告（可能影响体验） */
  WARNING = 'warning',
  /** 错误（影响功能） */
  ERROR = 'error',
  /** 严重错误（系统级问题） */
  CRITICAL = 'critical',
}

/**
 * 标准化的应用错误类
 */
export class AppError extends Error {
  /** 错误类型 */
  type: ErrorType;
  /** 严重级别 */
  severity: ErrorSeverity;
  /** 原始错误对象 */
  originalError?: any;
  /** 错误上下文信息 */
  context?: Record<string, any>;
  /** 是否需要上报 */
  shouldReport: boolean;
  /** 用户友好的错误消息 */
  userMessage: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    options?: {
      originalError?: any;
      context?: Record<string, any>;
      shouldReport?: boolean;
      userMessage?: string;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.originalError = options?.originalError;
    this.context = options?.context;
    this.shouldReport = options?.shouldReport ?? (severity === ErrorSeverity.CRITICAL);
    this.userMessage = options?.userMessage || message;

    // 保持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 转换为用户友好的错误消息
   */
  toUserMessage(): string {
    return this.userMessage;
  }

  /**
   * 转换为日志对象
   */
  toLogObject(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError?.message || this.originalError,
    };
  }
}

/**
 * 从任意错误对象中提取错误消息
 *
 * 支持的错误对象格式：
 * - { msg: string }
 * - { message: string }
 * - { response: { msg: string } }
 * - { data: { message: string } }
 * - Error 对象
 * - 字符串
 *
 * @param error - 错误对象
 * @param defaultMessage - 默认错误消息
 * @returns 提取的错误消息
 *
 * @example
 * ```typescript
 * const message = extractErrorMessage(error, '操作失败');
 * // 返回优先级：error.msg > error.response.msg > error.message > defaultMessage
 * ```
 */
export function extractErrorMessage(
  error: any,
  defaultMessage: string = '操作失败，请稍后重试'
): string {
  if (!error) return defaultMessage;

  // 字符串错误
  if (typeof error === 'string') return error;

  // 优先级1: error.msg
  if (error.msg && typeof error.msg === 'string') return error.msg;

  // 优先级2: error.response.msg
  if (error.response?.msg && typeof error.response.msg === 'string') {
    return error.response.msg;
  }

  // 优先级3: error.message
  if (error.message && typeof error.message === 'string') return error.message;

  // 优先级4: error.data.message
  if (error.data?.message && typeof error.data.message === 'string') {
    return error.data.message;
  }

  // 优先级5: error.response.data.message
  if (error.response?.data?.message && typeof error.response.data.message === 'string') {
    return error.response.data.message;
  }

  return defaultMessage;
}

/**
 * 判断错误类型
 *
 * @param error - 错误对象
 * @returns 错误类型
 *
 * @example
 * ```typescript
 * const type = getErrorType(error);
 * if (type === ErrorType.NETWORK) {
 *   // 处理网络错误
 * }
 * ```
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
 *
 * @param error - 错误对象
 * @returns 错误严重级别
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

/**
 * 创建验证错误
 *
 * @param message - 错误消息
 * @param context - 错误上下文
 * @returns AppError 实例
 *
 * @example
 * ```typescript
 * throw createValidationError('手机号格式不正确', { field: 'phone' });
 * ```
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
 *
 * @param message - 错误消息
 * @param originalError - 原始错误对象
 * @returns AppError 实例
 *
 * @example
 * ```typescript
 * throw createNetworkError('网络连接失败', error);
 * ```
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
 *
 * @param message - 错误消息
 * @param context - 错误上下文
 * @returns AppError 实例
 *
 * @example
 * ```typescript
 * throw createBusinessError('余额不足', { balance: 100, required: 200 });
 * ```
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
 *
 * @param message - 错误消息
 * @returns AppError 实例
 *
 * @example
 * ```typescript
 * throw createAuthError('登录已过期，请重新登录');
 * ```
 */
export function createAuthError(
  message: string = '登录已过期，请重新登录'
): AppError {
  return new AppError(message, ErrorType.AUTH, ErrorSeverity.ERROR, {
    shouldReport: false,
    userMessage: message,
  });
}

/**
 * 包装错误为 AppError
 *
 * @param error - 原始错误对象
 * @param defaultMessage - 默认错误消息
 * @returns AppError 实例
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   const appError = wrapError(error, '加载数据失败');
 *   handleError(appError);
 * }
 * ```
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
 *
 * @param error - 错误对象
 * @param context - 额外上下文信息
 *
 * @example
 * ```typescript
 * logError(error, { page: 'Login', action: 'submit' });
 * ```
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
    console.error('[CRITICAL ERROR]', logData);
  } else if (appError.severity === ErrorSeverity.ERROR) {
    console.error('[ERROR]', logData);
  } else if (appError.severity === ErrorSeverity.WARNING) {
    console.warn('[WARNING]', logData);
  } else {
    console.info('[INFO]', logData);
  }

  // TODO: 如果需要上报，调用上报服务
  if (appError.shouldReport) {
    // reportErrorToService(logData);
  }
}

/**
 * 统一错误处理高阶函数
 *
 * @param fn - 异步函数
 * @param options - 配置选项
 * @returns 包装后的函数
 *
 * @example
 * ```typescript
 * const safeLoadData = withErrorHandling(
 *   () => fetchData(),
 *   {
 *     onError: (error) => showToast('error', '加载失败', error.userMessage),
 *     defaultMessage: '加载数据失败',
 *   }
 * );
 *
 * await safeLoadData();
 * ```
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
