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
    /** @deprecated 已废弃，兼容旧版本，实际对应 withdrawable_money */
    money: '可调度收益',
    consignment_price: '寄售价格',
    service_fee: '服务费',
    service_fee_rate: '服务费率',
    all: '全部',
} as const;

export const BUSINESS_RECORD_TYPE_MAP = {
    consignment_record: 'matching_seller_income',
    subscription_record: 'blind_box_reserve',
    transfer_record: 'balance_transfer',
} as const;

export type BusinessRecordCategory = keyof typeof BUSINESS_RECORD_TYPE_MAP;

export const ACCOUNT_TYPE_OPTIONS = [
    { label: '供应链专项金', value: 'balance_available' },
    { label: '可调度收益', value: 'withdrawable_money' },
    { label: '确权金', value: 'service_fee_balance' },
    { label: '消费金', value: 'score' },
    { label: '绿色算力', value: 'green_power' },
    { label: '待激活确权金', value: 'pending_activation_gold' },
] as const;

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
    register_reward: '注册奖励',
    invite_reward: '邀请奖励',
    blind_box_reserve: '申购冻结',
    blind_box_refund: '申购退款',
    blind_box_diff_refund: '申购差价退款',
    matching_buy: '撮合购买',
    matching_seller_income: '寄售收益结算',
    matching_fail_refund: '撮合失败退款',
    matching_official_seller: '撮合交易',
    matching_commission: '撮合佣金',
    referral_reward_level1: '一级推荐奖励',
    referral_reward_level2: '二级推荐奖励',
    consign_buy: '寄售购买',
    consign_settle: '寄售结算',
    consign_settle_score: '寄售消费金结算',
    consign_apply_fee: '寄售申请费用',
    shop_order: '商城订单',
    shop_order_pay: '商城订单支付',
    shop_order_cancel: '商城订单取消',
    shop_order_cancel_review: '商城退单审核',
    service_fee_recharge: '确权金充值',
    sign_in: '签到奖励',
    sign_in_referral: '直推签到奖励',
    old_assets_unlock: '旧资产解锁',
    score_exchange_green_power: '消费金兑换算力',
    first_trade_reward: '首次交易奖励',
    sub_trade_reward: '下级首购奖励',
    questionnaire_reward: '问卷奖励',
    subordinate_first_trade_reward: '下级首次交易奖励',
    agent_commission: '代理分红',
    agent_direct_commission: '直推分红',
    agent_indirect_commission: '间推分红',
    agent_team_commission: '团队分红',
    rights_declaration_reward: '确权申报奖励',
    recharge_reward: '充值奖励',
    withdraw_apply: '提现申请',
    withdraw_reject: '提现驳回',
    balance_transfer: '划转记录',
    finance_add: '人工加款',
    finance_deduct: '人工扣款',
    reservation_refund: '预约退款',
    hashrate_compensation: '算力补偿',
    node_management_reward: '节点管理奖励',
} as const;

export const BUSINESS_TYPE_OPTIONS = Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => ({
    label,
    value,
}));

const ACCOUNT_TYPE_VALUE_SET: Set<string> = new Set(ACCOUNT_TYPE_OPTIONS.map((item) => item.value));

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
    { label: '寄售记录', value: 'consignment_record' },
    { label: '申购记录', value: 'subscription_record' },
    { label: '划转记录', value: 'transfer_record' },
    ...ACCOUNT_TYPE_OPTIONS,
    ...BUSINESS_TYPE_OPTIONS,
];

export interface AllLogCategoryQuery {
    type?: string;
    biz_type?: string;
}

export function resolveAllLogCategoryQuery(category: string): AllLogCategoryQuery {
    if (!category || category === 'all') {
        return {};
    }

    if (category in BUSINESS_RECORD_TYPE_MAP) {
        const bizType = BUSINESS_RECORD_TYPE_MAP[category as BusinessRecordCategory];
        return { biz_type: bizType };
    }

    if (category in BUSINESS_TYPE_LABELS) {
        return { biz_type: category };
    }

    if (ACCOUNT_TYPE_VALUE_SET.has(category)) {
        return { type: category };
    }

    return {};
}
