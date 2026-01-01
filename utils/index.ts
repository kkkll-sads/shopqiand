/**
 * 工具函数统一导出文件
 * 
 * 功能说明：
 * - 集中导出所有工具函数，简化导入路径
 * - 使用时只需从 utils 目录导入即可
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 * 
 * @example
 * // 使用示例
 * import { formatTime, formatAmount, isValidPhone, storage } from '@/utils';
 */

// 格式化工具函数
export {
    formatTime,
    formatDateShort,
    formatAmount,
    formatPhone,
    formatBankCard,
    formatIdCard,
    formatFileSize,
    formatNumber,
} from './format';

// 验证工具函数
export {
    isValidPhone,
    isValidIdCard,
    isValidPassword,
    isValidPayPassword,
    isValidBankCard,
    isValidEmail,
    isValidAmount,
    isNotEmpty,
} from './validation';

// 存储工具
export { storage, sessionStorage } from './storage';

// 日志工具
export {
    debugLog,
    bizLog,
    warnLog,
    errorLog,
    enableDebugLog,
    disableDebugLog,
    isDebugLogEnabled,
} from './logger';

// API 错误处理工具
export {
    getApiErrorMessage,
    isApiSuccess,
    isRateLimitError,
    getErrorMessage,
    formatRateLimitMessage,
    handleApiError,
} from './apiErrorHandler';
