/**
 * format - 格式化工具函数
 * 
 * 功能说明：
 * - 提供统一的数据格式化方法
 * - 包括时间、金额、手机号等常用格式化
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

/**
 * 格式化时间戳为日期时间字符串
 * 
 * @param timestamp - 时间戳（秒或毫秒）或日期字符串
 * @param format - 输出格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期时间字符串
 * 
 * @example
 * formatTime(1700000000) // '2023-11-15 03:33:20'
 * formatTime(1700000000, 'YYYY-MM-DD') // '2023-11-15'
 * formatTime('2023-11-15 10:30:00') // '2023-11-15 10:30:00'
 */
export const formatTime = (
    timestamp: number | string | null | undefined,
    format: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss' | 'YYYY-MM-DD HH:mm' | 'MM-DD HH:mm' = 'YYYY-MM-DD HH:mm:ss'
): string => {
    // 处理空值
    if (timestamp === null || timestamp === undefined || timestamp === '') {
        return '-';
    }

    let date: Date;

    // 处理不同类型的输入
    if (typeof timestamp === 'number') {
        // 如果是10位数字，认为是秒级时间戳，需要转换为毫秒
        const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
        date = new Date(ts);
    } else if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
        // 如果是纯数字字符串，也作为时间戳处理
        const num = parseInt(timestamp, 10);
        const ts = num < 10000000000 ? num * 1000 : num;
        date = new Date(ts);
    } else {
        date = new Date(timestamp);
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        return '-';
    }

    // 获取日期各部分
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // 根据格式返回
    switch (format) {
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'YYYY-MM-DD HH:mm':
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        case 'MM-DD HH:mm':
            return `${month}-${day} ${hours}:${minutes}`;
        case 'YYYY-MM-DD HH:mm:ss':
        default:
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
};

/**
 * 格式化日期为简短格式（今天/昨天/具体日期）
 * 
 * @param timestamp - 时间戳或日期字符串
 * @returns 简短格式的日期字符串
 * 
 * @example
 * formatDateShort(Date.now()) // '今天 14:30'
 * formatDateShort(Date.now() - 86400000) // '昨天 14:30'
 * formatDateShort(1700000000) // '11-15 03:33'
 */
export const formatDateShort = (timestamp: number | string | null | undefined): string => {
    if (timestamp === null || timestamp === undefined || timestamp === '') {
        return '-';
    }

    let date: Date;
    if (typeof timestamp === 'number') {
        const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
        date = new Date(ts);
    } else {
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
        return '-';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (targetDay.getTime() === today.getTime()) {
        return `今天 ${timeStr}`;
    } else if (targetDay.getTime() === yesterday.getTime()) {
        return `昨天 ${timeStr}`;
    } else {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}-${day} ${timeStr}`;
    }
};

/**
 * 格式化金额
 * 
 * @param value - 金额值（数字或字符串）
 * @param options - 格式化选项
 * @returns 格式化后的金额字符串
 * 
 * @example
 * formatAmount(1234.5) // '1,234.50'
 * formatAmount('1234.56', { prefix: '¥' }) // '¥1,234.56'
 * formatAmount(1234, { decimals: 0 }) // '1,234'
 */
export const formatAmount = (
    value: number | string | null | undefined,
    options: {
        /** 小数位数，默认 2 */
        decimals?: number;
        /** 前缀符号，如 '¥' */
        prefix?: string;
        /** 是否显示千分位分隔符，默认 true */
        thousandSeparator?: boolean;
    } = {}
): string => {
    const { decimals = 2, prefix = '', thousandSeparator = true } = options;

    // 处理空值
    if (value === null || value === undefined || value === '') {
        return prefix + '0.00';
    }

    // 转换为数字
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // 检查是否为有效数字（双重验证，确保类型安全）
    if (numValue === null || numValue === undefined || isNaN(numValue) || typeof numValue !== 'number') {
        return prefix + '0.00';
    }

    // 格式化数字（确保 numValue 是有效的 number 类型）
    let formatted = Number(numValue).toFixed(decimals);

    // 添加千分位分隔符
    if (thousandSeparator) {
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        formatted = parts.join('.');
    }

    return prefix + formatted;
};

/**
 * 格式化手机号（隐藏中间4位）
 * 
 * @param phone - 手机号码
 * @returns 脱敏后的手机号
 * 
 * @example
 * formatPhone('13812345678') // '138****5678'
 */
export const formatPhone = (phone: string | null | undefined): string => {
    if (!phone || phone.length < 11) {
        return phone || '-';
    }
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

/**
 * 格式化银行卡号（只显示后4位）
 * 
 * @param cardNumber - 银行卡号
 * @returns 脱敏后的银行卡号
 * 
 * @example
 * formatBankCard('6222021234567890123') // '**** **** **** 0123'
 */
export const formatBankCard = (cardNumber: string | null | undefined): string => {
    if (!cardNumber || cardNumber.length < 4) {
        return cardNumber || '-';
    }
    const last4 = cardNumber.slice(-4);
    return `**** **** **** ${last4}`;
};

/**
 * 格式化身份证号（隐藏中间部分）
 * 
 * @param idCard - 身份证号
 * @returns 脱敏后的身份证号
 * 
 * @example
 * formatIdCard('110101199001011234') // '110101********1234'
 */
export const formatIdCard = (idCard: string | null | undefined): string => {
    if (!idCard || idCard.length < 15) {
        return idCard || '-';
    }
    return idCard.replace(/(\d{6})\d+(\d{4})/, '$1********$2');
};

/**
 * 格式化文件大小
 * 
 * @param bytes - 字节数
 * @returns 人类可读的文件大小
 * 
 * @example
 * formatFileSize(1024) // '1.00 KB'
 * formatFileSize(1048576) // '1.00 MB'
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);

    return `${size.toFixed(2)} ${units[i]}`;
};

/**
 * 格式化数字（添加单位：万、亿）
 * 
 * @param num - 数字
 * @returns 带单位的数字字符串
 * 
 * @example
 * formatNumber(12345) // '1.23万'
 * formatNumber(123456789) // '1.23亿'
 * formatNumber(999) // '999'
 */
export const formatNumber = (num: number | string | null | undefined): string => {
    if (num === null || num === undefined || num === '') {
        return '0';
    }

    const n = typeof num === 'string' ? parseFloat(num) : num;

    if (isNaN(n)) {
        return '0';
    }

    if (n >= 100000000) {
        return (n / 100000000).toFixed(2) + '亿';
    } else if (n >= 10000) {
        return (n / 10000).toFixed(2) + '万';
    } else {
        return String(n);
    }
};

/**
 * 智能格式化价格（去除尾部多余零）
 * 
 * @param value - 金额值（数字或字符串）
 * @param options - 格式化选项
 * @returns 格式化后的金额字符串（整数不显示小数点，小数去除尾零）
 * 
 * @example
 * formatPriceSmart(100.00) // '100'
 * formatPriceSmart(100.50) // '100.5'
 * formatPriceSmart(100.56) // '100.56'
 * formatPriceSmart(100.00, { prefix: '¥' }) // '¥100'
 */
export const formatPriceSmart = (
    value: number | string | null | undefined,
    options: {
        /** 前缀符号，如 '¥' */
        prefix?: string;
        /** 最大小数位数，默认 2 */
        maxDecimals?: number;
        /** 是否显示千分位分隔符，默认 false */
        thousandSeparator?: boolean;
    } = {}
): string => {
    const { prefix = '', maxDecimals = 2, thousandSeparator = false } = options;

    // 处理空值
    if (value === null || value === undefined || value === '') {
        return prefix + '0';
    }

    // 转换为数字
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // 检查是否为有效数字
    if (isNaN(numValue)) {
        return prefix + '0';
    }

    // 格式化数字，保留最多 maxDecimals 位小数，自动去除尾部零
    let formatted: string;
    
    // 先保留指定位数小数
    const fixed = numValue.toFixed(maxDecimals);
    // 转换为数字再转回字符串，自动去除尾部零
    formatted = String(parseFloat(fixed));

    // 添加千分位分隔符
    if (thousandSeparator) {
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        formatted = parts.join('.');
    }

    return prefix + formatted;
};
