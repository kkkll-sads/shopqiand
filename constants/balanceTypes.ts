/**
 * 资金类型映射
 * Maps balance field keys to their Chinese display names
 */
export const BALANCE_TYPE_LABELS: Record<string, string> = {
    balance_available: '供应链专项金',
    withdrawable_money: '可调度收益',
    service_fee_balance: '确权金',
    green_power: '绿色算力',
    score: '消费金',
    pending_activation_gold: '待激活确权金',
    all: '全部',
} as const;

/**
 * 获取资金类型的中文名称
 * @param type - 资金类型字段名
 * @returns 中文名称，如果未找到则返回原始类型
 */
export function getBalanceTypeLabel(type: string): string {
    return BALANCE_TYPE_LABELS[type] || type;
}

/**
 * 资金类型选项（用于筛选器下拉列表）
 */
export const BALANCE_TYPE_OPTIONS = [
    { label: '全部', value: 'all' },
    { label: '供应链专项金', value: 'balance_available' },
    { label: '可调度收益', value: 'withdrawable_money' },
    { label: '确权金', value: 'service_fee_balance' },
    { label: '消费金', value: 'score' },
    { label: '绿色算力', value: 'green_power' },
    { label: '待激活确权金', value: 'pending_activation_gold' },
] as const;
