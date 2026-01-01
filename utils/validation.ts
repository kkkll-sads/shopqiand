/**
 * validation - 验证工具函数
 * 
 * 功能说明：
 * - 提供统一的表单验证方法
 * - 包括手机号、身份证、密码等常用验证
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

/**
 * 验证结果接口
 */
interface ValidationResult {
    /** 是否验证通过 */
    valid: boolean;
    /** 错误信息（验证失败时） */
    message?: string;
}

/**
 * 验证手机号格式
 * 
 * @param phone - 手机号
 * @returns 验证结果
 * 
 * @example
 * isValidPhone('13812345678') // { valid: true }
 * isValidPhone('12345678901') // { valid: false, message: '请输入正确的手机号' }
 */
export const isValidPhone = (phone: string | null | undefined): ValidationResult => {
    if (!phone) {
        return { valid: false, message: '请输入手机号' };
    }

    // 中国大陆手机号：1开头，第二位3-9，共11位
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
        return { valid: false, message: '请输入正确的手机号' };
    }

    return { valid: true };
};

/**
 * 验证身份证号格式（支持15位和18位）
 * 
 * @param idCard - 身份证号
 * @returns 验证结果
 * 
 * @example
 * isValidIdCard('110101199001011234') // { valid: true }
 * isValidIdCard('12345678') // { valid: false, message: '请输入正确的身份证号' }
 */
export const isValidIdCard = (idCard: string | null | undefined): ValidationResult => {
    if (!idCard) {
        return { valid: false, message: '请输入身份证号' };
    }

    // 15位身份证正则
    const idCard15Regex = /^[1-9]\d{5}\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{2}[0-9Xx]$/;

    // 18位身份证正则
    const idCard18Regex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;

    if (!idCard15Regex.test(idCard) && !idCard18Regex.test(idCard)) {
        return { valid: false, message: '请输入正确的身份证号' };
    }

    // 18位身份证需要验证校验码
    if (idCard.length === 18) {
        const checkResult = validateIdCardChecksum(idCard);
        if (!checkResult) {
            return { valid: false, message: '身份证号校验码错误' };
        }
    }

    return { valid: true };
};

/**
 * 验证18位身份证校验码
 * 
 * @param idCard - 18位身份证号
 * @returns 校验是否通过
 */
const validateIdCardChecksum = (idCard: string): boolean => {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
        sum += parseInt(idCard[i]) * weights[i];
    }

    const checkCode = checkCodes[sum % 11];
    return checkCode === idCard[17].toUpperCase();
};

/**
 * 验证登录密码格式
 * 
 * @param password - 密码
 * @param options - 验证选项
 * @returns 验证结果
 * 
 * @example
 * isValidPassword('abc123') // { valid: false, message: '密码长度不能少于6位' }
 * isValidPassword('abcdefgh') // { valid: true }
 */
export const isValidPassword = (
    password: string | null | undefined,
    options: {
        /** 最小长度，默认 6 */
        minLength?: number;
        /** 最大长度，默认 20 */
        maxLength?: number;
        /** 是否需要包含数字，默认 false */
        requireNumber?: boolean;
        /** 是否需要包含字母，默认 false */
        requireLetter?: boolean;
        /** 是否需要包含特殊字符，默认 false */
        requireSpecial?: boolean;
    } = {}
): ValidationResult => {
    const {
        minLength = 6,
        maxLength = 20,
        requireNumber = false,
        requireLetter = false,
        requireSpecial = false,
    } = options;

    if (!password) {
        return { valid: false, message: '请输入密码' };
    }

    if (password.length < minLength) {
        return { valid: false, message: `密码长度不能少于${minLength}位` };
    }

    if (password.length > maxLength) {
        return { valid: false, message: `密码长度不能超过${maxLength}位` };
    }

    if (requireNumber && !/\d/.test(password)) {
        return { valid: false, message: '密码必须包含数字' };
    }

    if (requireLetter && !/[a-zA-Z]/.test(password)) {
        return { valid: false, message: '密码必须包含字母' };
    }

    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: '密码必须包含特殊字符' };
    }

    return { valid: true };
};

/**
 * 验证支付密码格式（6位数字）
 * 
 * @param payPassword - 支付密码
 * @returns 验证结果
 * 
 * @example
 * isValidPayPassword('123456') // { valid: true }
 * isValidPayPassword('12345') // { valid: false, message: '支付密码必须为6位数字' }
 */
export const isValidPayPassword = (payPassword: string | null | undefined): ValidationResult => {
    if (!payPassword) {
        return { valid: false, message: '请输入支付密码' };
    }

    const payPasswordRegex = /^\d{6}$/;

    if (!payPasswordRegex.test(payPassword)) {
        return { valid: false, message: '支付密码必须为6位数字' };
    }

    return { valid: true };
};

/**
 * 验证银行卡号格式
 * 
 * @param cardNumber - 银行卡号
 * @returns 验证结果
 * 
 * @example
 * isValidBankCard('6222021234567890123') // { valid: true }
 * isValidBankCard('123') // { valid: false, message: '请输入正确的银行卡号' }
 */
export const isValidBankCard = (cardNumber: string | null | undefined): ValidationResult => {
    if (!cardNumber) {
        return { valid: false, message: '请输入银行卡号' };
    }

    // 移除空格
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // 银行卡号通常为16-19位数字
    const bankCardRegex = /^\d{16,19}$/;

    if (!bankCardRegex.test(cleanNumber)) {
        return { valid: false, message: '请输入正确的银行卡号' };
    }

    // Luhn算法校验
    if (!validateLuhn(cleanNumber)) {
        return { valid: false, message: '银行卡号校验不通过' };
    }

    return { valid: true };
};

/**
 * Luhn算法校验（银行卡号校验）
 * 
 * @param cardNumber - 银行卡号
 * @returns 校验是否通过
 */
const validateLuhn = (cardNumber: string): boolean => {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * 验证邮箱格式
 * 
 * @param email - 邮箱地址
 * @returns 验证结果
 * 
 * @example
 * isValidEmail('test@example.com') // { valid: true }
 * isValidEmail('invalid-email') // { valid: false, message: '请输入正确的邮箱地址' }
 */
export const isValidEmail = (email: string | null | undefined): ValidationResult => {
    if (!email) {
        return { valid: false, message: '请输入邮箱地址' };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
        return { valid: false, message: '请输入正确的邮箱地址' };
    }

    return { valid: true };
};

/**
 * 验证金额格式
 * 
 * @param amount - 金额
 * @param options - 验证选项
 * @returns 验证结果
 * 
 * @example
 * isValidAmount('100.50') // { valid: true }
 * isValidAmount('0') // { valid: false, message: '金额必须大于0' }
 */
export const isValidAmount = (
    amount: string | number | null | undefined,
    options: {
        /** 最小金额，默认 0.01 */
        min?: number;
        /** 最大金额 */
        max?: number;
        /** 允许的小数位数，默认 2 */
        decimals?: number;
    } = {}
): ValidationResult => {
    const { min = 0.01, max, decimals = 2 } = options;

    if (amount === null || amount === undefined || amount === '') {
        return { valid: false, message: '请输入金额' };
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return { valid: false, message: '请输入正确的金额' };
    }

    if (numAmount < min) {
        return { valid: false, message: `金额不能小于${min}` };
    }

    if (max !== undefined && numAmount > max) {
        return { valid: false, message: `金额不能大于${max}` };
    }

    // 检查小数位数
    const decimalPart = String(amount).split('.')[1];
    if (decimalPart && decimalPart.length > decimals) {
        return { valid: false, message: `金额最多${decimals}位小数` };
    }

    return { valid: true };
};

/**
 * 验证是否为空
 * 
 * @param value - 要验证的值
 * @param fieldName - 字段名称（用于错误提示）
 * @returns 验证结果
 * 
 * @example
 * isNotEmpty('hello', '用户名') // { valid: true }
 * isNotEmpty('', '用户名') // { valid: false, message: '请输入用户名' }
 */
export const isNotEmpty = (
    value: string | null | undefined,
    fieldName: string = '内容'
): ValidationResult => {
    if (!value || value.trim() === '') {
        return { valid: false, message: `请输入${fieldName}` };
    }
    return { valid: true };
};
