/**
 * 银行列表数据
 * 使用 bankcard npm 包提供的银行列表
 * 用于银行卡管理页面
 */
import { banks } from 'bankcard';

/**
 * 银行信息接口
 */
export interface BankInfo {
    code: string;
    name: string;
}

/**
 * 获取完整银行信息列表 (包含 code 和 name)
 */
export const getBankList = (): BankInfo[] => {
    return banks;
};

/**
 * 获取银行名称列表
 * 用于兼容原有的选择器组件
 */
export const getBanks = (): string[] => {
    return banks.map(bank => bank.name);
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
