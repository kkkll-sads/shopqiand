/**
 * errorHelpers/types.ts - 错误类型与核心错误类
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
 * AppError 构造配置
 */
export interface AppErrorOptions {
  originalError?: any;
  context?: Record<string, any>;
  shouldReport?: boolean;
  userMessage?: string;
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
    options?: AppErrorOptions
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
