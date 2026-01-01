/**
 * 银行列表数据
 * 使用 bankcard npm 包提供的银行列表
 * 用于银行卡管理页面
 */
import { banks } from 'bankcard';

/**
 * 银行信息接口
 */
const COMMON_BANK_CODES = [
    'ICBC',    // 工商银行
    'ABC',     // 农业银行
    'BOC',     // 中国银行
    'CCB',     // 建设银行
    'CMB',     // 招商银行
    'PSBC',    // 邮储银行
    'COMM',    // 交通银行
    'CITIC',   // 中信银行
    'SPDB',    // 浦发银行
    'CIB',     // 兴业银行
    'CMBC',    // 民生银行
    'GDB',     // 广发银行
    'SPABANK', // 平安银行
];

/**
 * 排序后的银行列表
 */
const sortedBanks = [...banks].sort((a, b) => {
    const indexA = COMMON_BANK_CODES.indexOf(a.code);
    const indexB = COMMON_BANK_CODES.indexOf(b.code);

    if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
});

/**
 * 银行信息接口
 */
export interface BankInfo {
    code: string;
    name: string;
}

/**
 * 获取完整银行信息列表 (包含 code 和 name)
 * 已按常用银行排序
 */
export const getBankList = (): BankInfo[] => {
    return sortedBanks;
};

/**
 * 获取银行名称列表
 * 用于兼容原有的选择器组件
 */
export const getBanks = (): string[] => {
    return sortedBanks.map(bank => bank.name);
};

/**
 * 根据银行 code 获取银行名称
 */
export const getBankNameByCode = (code: string): string | undefined => {
    const bank = banks.find(b => b.code === code);
    return bank?.name;
};

/**
 * 根据银行名称获取银行 code
 */
export const getBankCodeByName = (name: string): string | undefined => {
    const bank = banks.find(b => b.name === name);
    return bank?.code;
};
