/**
 * 资金相关类型与业务类型
 */

/**
 * 资金类型（账户类型）
 * ba_user_money_log.field_type
 */
export enum AccountType {
  BALANCE_AVAILABLE = 'balance_available',
  WITHDRAWABLE_MONEY = 'withdrawable_money',
  SERVICE_FEE_BALANCE = 'service_fee_balance',
  SCORE = 'score',
  GREEN_POWER = 'green_power',
  PENDING_ACTIVATION_GOLD = 'pending_activation_gold',
}

export const AccountTypeMap: Record<AccountType, string> = {
  [AccountType.BALANCE_AVAILABLE]: '专项金',
  [AccountType.WITHDRAWABLE_MONEY]: '可提现金额',
  [AccountType.SERVICE_FEE_BALANCE]: '确权金',
  [AccountType.SCORE]: '消费金',
  [AccountType.GREEN_POWER]: '绿色算力',
  [AccountType.PENDING_ACTIVATION_GOLD]: '待激活确权金',
}

/**
 * 资金流向
 */
export enum FlowDirection {
  IN = 'in',
  OUT = 'out',
}

export const FlowDirectionMap: Record<FlowDirection, string> = {
  [FlowDirection.IN]: '收入',
  [FlowDirection.OUT]: '支出',
}

/**
 * 资金流水业务类型
 * ba_user_money_log.biz_type
 */
export enum BizType {
  REGISTER_REWARD = 'register_reward',
  INVITE_REWARD = 'invite_reward',
  BLIND_BOX_RESERVE = 'blind_box_reserve',
  BLIND_BOX_REFUND = 'blind_box_refund',
  BLIND_BOX_DIFF_REFUND = 'blind_box_diff_refund',
  MATCHING_BUY = 'matching_buy',
  MATCHING_SELLER_INCOME = 'matching_seller_income',
  MATCHING_REFUND = 'matching_refund',
  MATCHING_OFFICIAL_SELLER = 'matching_official_seller',
  MATCHING_COMMISSION = 'matching_commission',
  CONSIGN_BUY = 'consign_buy',
  CONSIGN_SETTLE = 'consign_settle',
  CONSIGN_SETTLE_SCORE = 'consign_settle_score',
  CONSIGN_APPLY_FEE = 'consign_apply_fee',
  SHOP_ORDER = 'shop_order',
  SHOP_ORDER_PAY = 'shop_order_pay',
  SERVICE_FEE_RECHARGE = 'service_fee_recharge',
  SIGN_IN = 'sign_in',
  SIGN_IN_REFERRAL = 'sign_in_referral',
  OLD_ASSETS_UNLOCK = 'old_assets_unlock',
  SCORE_EXCHANGE_GREEN_POWER = 'score_exchange_green_power',
  FIRST_TRADE_REWARD = 'first_trade_reward',
  QUESTIONNAIRE_REWARD = 'questionnaire_reward',
  AGENT_COMMISSION = 'agent_commission',
  AGENT_DIRECT_COMMISSION = 'agent_direct_commission',
  AGENT_TEAM_COMMISSION = 'agent_team_commission',
  RIGHTS_DECLARATION_REWARD = 'rights_declaration_reward',
}

export const BizTypeMap: Record<BizType, string> = {
  [BizType.REGISTER_REWARD]: '注册奖励',
  [BizType.INVITE_REWARD]: '邀请奖励',
  [BizType.BLIND_BOX_RESERVE]: '盲盒预约',
  [BizType.BLIND_BOX_REFUND]: '盲盒退款',
  [BizType.BLIND_BOX_DIFF_REFUND]: '盲盒差价退款',
  [BizType.MATCHING_BUY]: '撮合购买',
  [BizType.MATCHING_SELLER_INCOME]: '撮合卖家收入',
  [BizType.MATCHING_REFUND]: '撮合退款',
  [BizType.MATCHING_OFFICIAL_SELLER]: '撮合交易',
  [BizType.MATCHING_COMMISSION]: '撮合佣金',
  [BizType.CONSIGN_BUY]: '寄售购买',
  [BizType.CONSIGN_SETTLE]: '寄售结算',
  [BizType.CONSIGN_SETTLE_SCORE]: '寄售消费金结算',
  [BizType.CONSIGN_APPLY_FEE]: '寄售申请费用',
  [BizType.SHOP_ORDER]: '商城订单',
  [BizType.SHOP_ORDER_PAY]: '商城订单支付',
  [BizType.SERVICE_FEE_RECHARGE]: '确权金充值',
  [BizType.SIGN_IN]: '每日签到',
  [BizType.SIGN_IN_REFERRAL]: '直推签到奖励',
  [BizType.OLD_ASSETS_UNLOCK]: '老资产解锁',
  [BizType.SCORE_EXCHANGE_GREEN_POWER]: '消费金兑换绿色算力',
  [BizType.FIRST_TRADE_REWARD]: '首次交易奖励',
  [BizType.QUESTIONNAIRE_REWARD]: '问卷奖励',
  [BizType.AGENT_COMMISSION]: '代理分红',
  [BizType.AGENT_DIRECT_COMMISSION]: '直推分红',
  [BizType.AGENT_TEAM_COMMISSION]: '团队分红',
  [BizType.RIGHTS_DECLARATION_REWARD]: '确权申报奖励',
}
