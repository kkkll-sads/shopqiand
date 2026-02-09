import { ApiResponse } from './networking';
import { API_ENDPOINTS } from './config';
// 统一的带 token 请求封装，减少重复从 localStorage 取值
import { authedFetch } from './client';

// 支付账户相关 (银行卡/支付宝/微信/USDT)
export interface PaymentAccountItem {
    id: number;
    user_id: number;
    type: string; // bank_card, alipay, wechat, usdt
    type_text?: string;
    account: string;
    account_number?: string; // 兼容后端可能返回的 account_number 字段
    account_number_display?: string; // 用于显示的账号（可能是脱敏后的）
    account_name: string;
    bank_name?: string;
    bank_branch?: string;
    qrcode?: string;
    is_default: number;
    [key: string]: any;
}

export interface PaymentAccountListData {
    list: PaymentAccountItem[];
    [key: string]: any;
}

export async function fetchPaymentAccountList(token: string): Promise<ApiResponse<PaymentAccountListData>> {
    // 使用 authedFetch，允许调用方传入 token 覆盖默认存储值
    return authedFetch<PaymentAccountListData>(API_ENDPOINTS.user.paymentAccountList, {
        method: 'GET',
        token,
    });
}

export interface AddPaymentAccountParams {
    type: string;
    account_type: 'personal' | 'company';
    bank_name: string;
    account_name: string;
    account_number: string;
    bank_branch?: string;
    screenshot?: File;
    token?: string;
}

export async function addPaymentAccount(params: AddPaymentAccountParams): Promise<ApiResponse> {
    const payload = new FormData();
    payload.append('type', params.type);
    payload.append('account_type', params.account_type);
    payload.append('bank_name', params.bank_name);
    payload.append('account_name', params.account_name);
    payload.append('account_number', params.account_number);
    if (params.bank_branch) payload.append('bank_branch', params.bank_branch);
    if (params.screenshot) payload.append('screenshot', params.screenshot);

    return authedFetch(API_ENDPOINTS.user.addPaymentAccount, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}

export interface EditPaymentAccountParams {
    id: string;
    bank_name: string;
    account_name: string;
    account_number: string;
    bank_branch?: string;
    screenshot?: File;
    token?: string;
}

export async function editPaymentAccount(params: EditPaymentAccountParams): Promise<ApiResponse> {
    const payload = new FormData();
    payload.append('id', params.id);
    payload.append('bank_name', params.bank_name);
    payload.append('account_name', params.account_name);
    payload.append('account_number', params.account_number);
    if (params.bank_branch) payload.append('bank_branch', params.bank_branch);
    if (params.screenshot) payload.append('screenshot', params.screenshot);

    return authedFetch(API_ENDPOINTS.user.editPaymentAccount, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}

export async function deletePaymentAccount(params: { id: string; token?: string }): Promise<ApiResponse> {
    const payload = new FormData();
    payload.append('id', params.id);

    return authedFetch(API_ENDPOINTS.user.deletePaymentAccount, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}

export async function setDefaultPaymentAccount(params: { id: string; token?: string }): Promise<ApiResponse> {
    const payload = new FormData();
    payload.append('id', params.id);

    return authedFetch(API_ENDPOINTS.user.setDefaultPaymentAccount, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}

// 资金明细相关
export interface BalanceLogItem {
    id: number;
    user_id: number;
    money: number; // 变动金额
    before: number;
    after: number;
    memo: string;
    createtime: number;
    create_time_text?: string;
    type?: string;
    amount?: number; // 兼容 amount
    before_balance?: number; // 兼容 before_balance
    after_balance?: number; // 兼容 after_balance
    remark?: string; // 兼容 remark
    create_time?: number; // 兼容 create_time
    [key: string]: any;
}

export interface BalanceLogListData {
    list: BalanceLogItem[];
    total: number;
    per_page: number;
    current_page: number;
}

export interface GetBalanceLogParams {
    page?: number;
    limit?: number;
    token?: string;
}

/**
 * 获取专项金/余额明细（已迁移：统一走 allLog）
 * 替代废弃接口 /Account/balance
 */
export async function getBalanceLog(params: GetBalanceLogParams = {}): Promise<ApiResponse<BalanceLogListData>> {
    const res = await getAllLog({
        ...params,
        type: 'balance_available',
    });
    return res as unknown as ApiResponse<BalanceLogListData>;
}

export interface AllLogItem {
    id: number;
    amount: number | string; // 可能是 + 或 -
    memo: string;
    createtime: number;
    type: 'balance_available' | 'withdrawable_money' | 'service_fee_balance' | 'score' | string;
    field_type?: string;     // 精确字段类型
    before_value: number;
    after_value: number;
    remark?: string;
    [key: string]: any;
}

export interface AllLogListData {
    list: AllLogItem[];
    total: number;
    per_page: number;
    current_page: number;
}

export interface GetAllLogParams extends GetBalanceLogParams {
    type?: string;
    start_time?: string | number;
    end_time?: string | number;
    flow_direction?: 'in' | 'out' | 'all';
    /** 业务类型筛选，如 matching_buy, consignment_income, recharge 等 */
    biz_type?: string;
    /** 备注关键词搜索 */
    keyword?: string;
}

export async function getAllLog(params: GetAllLogParams = {}): Promise<ApiResponse<AllLogListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.type) search.set('type', params.type);
    if (params.start_time) search.set('start_time', String(params.start_time));
    if (params.end_time) search.set('end_time', String(params.end_time));
    if (params.flow_direction) search.set('flow_direction', params.flow_direction);
    if (params.biz_type != null && params.biz_type !== '') search.set('biz_type', params.biz_type);
    if (params.keyword != null && params.keyword.trim() !== '') search.set('keyword', params.keyword.trim());

    const path = `${API_ENDPOINTS.account.allLog}?${search.toString()}`;
    return authedFetch<AllLogListData>(path, {
        method: 'GET',
        token: params.token,
    });
}


// 资金明细详情
export interface MoneyLogDetailData {
    id: number;
    flow_no: string;
    batch_no?: string;
    biz_type?: string;
    biz_id?: number;
    account_type?: string;
    amount: number;
    before_value: number;
    after_value: number;
    memo?: string;
    create_time: number;
    create_time_text?: string;
    title_snapshot?: string;
    image_snapshot?: string;
    user_collection_id?: number;
    item_id?: number;
    breakdown?: any;
    [key: string]: any;
}

export interface GetMoneyLogDetailParams {
    id?: number | string;
    flow_no?: string;
    token?: string;
}

export async function getMoneyLogDetail(params: GetMoneyLogDetailParams): Promise<ApiResponse<MoneyLogDetailData>> {
    const search = new URLSearchParams();
    if (params.id !== undefined && params.id !== null) {
        search.set('id', String(params.id));
    }
    if (params.flow_no) {
        search.set('flow_no', params.flow_no);
    }

    const path = `${API_ENDPOINTS.account.moneyLogDetail}?${search.toString()}`;
    return authedFetch<MoneyLogDetailData>(path, {
        method: 'GET',
        token: params.token,
    });
}

// 服务费相关
export interface ServiceFeeLogItem {
    id: number;
    amount: number;
    before_service_fee: number;
    after_service_fee: number;
    remark: string;
    create_time: number;
}

export interface ServiceFeeLogListData {
    list: ServiceFeeLogItem[];
    total: number;
    per_page: number;
    current_page: number;
}

export interface GetServiceFeeLogParams {
    page?: number;
    limit?: number;
    token?: string;
}

/**
 * 获取服务费明细（已迁移：统一走 allLog）
 * 替代废弃接口 /Account/serviceFeeLog
 */
export async function getServiceFeeLog(params: GetServiceFeeLogParams = {}): Promise<ApiResponse<ServiceFeeLogListData>> {
    const res = await getAllLog({
        ...params,
        type: 'service_fee_balance',
    });
    return res as unknown as ApiResponse<ServiceFeeLogListData>;
}

export interface TransferBalanceToServiceFeeParams {
    amount: number | string;
    pay_type?: 'money' | 'withdraw';
    token?: string;
}

export interface TransferBalanceToServiceFeeResponse {
    balance_available: number;
    service_fee_balance: number;
}

export async function transferBalanceToServiceFee(
    params: TransferBalanceToServiceFeeParams,
): Promise<ApiResponse<TransferBalanceToServiceFeeResponse>> {
    if (!params.amount || Number(params.amount) <= 0) {
        throw new Error('请输入有效的划转金额');
    }

    const url = `${API_ENDPOINTS.account.transferBalanceToServiceFee}?amount=${params.amount}${params.pay_type ? `&pay_type=${params.pay_type}` : ''}`;
    return authedFetch<TransferBalanceToServiceFeeResponse>(url, {
        method: 'POST',
        token: params.token,
    });
}

export interface RechargeServiceFeeParams {
    amount: number | string;
    remark?: string;
    source?: 'balance_available' | 'withdrawable_money' | '';
    token?: string;
}

export async function rechargeServiceFee(params: RechargeServiceFeeParams): Promise<ApiResponse> {
    if (!params.amount || Number(params.amount) <= 0) {
        throw new Error('请输入有效的充值金额');
    }

    const search = new URLSearchParams();
    search.append('amount', String(params.amount));
    if (params.remark) search.append('remark', params.remark);

    const url = `${API_ENDPOINTS.account.rechargeServiceFee}?${search.toString()}`;

    const payload: Record<string, any> = {
        amount: Number(params.amount),
    };
    if (params.source) payload.source = params.source;

    return authedFetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        token: params.token,
    });
}

// 公司充值账户
export interface CompanyAccountItem {
    id: number;
    type: string; // bank_card, alipay, wechat, usdt
    type_text?: string;
    account_name: string;
    account_number: string;
    bank_name?: string;     // 银行名称(银行卡类型时)
    bank_branch?: string;   // 开户行(银行卡类型时)
    icon: string;           // 支付图标URL
    remark: string;
    status: number;         // 1=充值可用, 2=提现可用, 3=充值提现可用
    status_text?: string;
    [key: string]: any;
}

export async function fetchCompanyAccountList(params: { usage?: string; token?: string } = {}): Promise<ApiResponse<{ list: CompanyAccountItem[] }>> {
    const search = new URLSearchParams();
    if (params.usage) search.set('usage', params.usage);

    const path = `${API_ENDPOINTS.recharge.companyAccountList}?${search.toString()}`;
    return authedFetch<{ list: CompanyAccountItem[] }>(path, {
        method: 'GET',
        token: params.token,
    });
}

export interface SubmitRechargeOrderParams {
    company_account_id: number;
    amount: number | string;
    voucher?: File; // 凭证图片
    payment_screenshot?: File; // 兼容
    payment_screenshot_id?: number | string; // 兼容
    payment_screenshot_url?: string; // 兼容
    payment_type?: string;
    payment_method?: 'online' | 'offline';
    remark?: string;
    card_last_four?: string; // 付款银行卡后四位
    token?: string;
}

export async function submitRechargeOrder(params: SubmitRechargeOrderParams): Promise<ApiResponse<{ order_id?: number; order_no?: string; pay_url?: string }>> {
    const payload = new FormData();
    payload.append('company_account_id', String(params.company_account_id));
    payload.append('amount', String(params.amount));

    if (params.payment_method) {
        payload.append('payment_method', params.payment_method);
    } else {
        payload.append('payment_method', 'offline');
    }

    // 兼容不同的图片字段
    const image = params.voucher || params.payment_screenshot;
    if (image) payload.append('payment_screenshot', image);

    if (params.remark) payload.append('remark', params.remark);
    if (params.payment_type) payload.append('payment_type', params.payment_type);
    if (params.card_last_four) payload.append('user_remark', params.card_last_four);

    return authedFetch<{ order_id?: number; order_no?: string; pay_url?: string }>(API_ENDPOINTS.recharge.submitOrder, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}

/**
 * 更新充值订单备注（用户支付反馈）
 */
export interface UpdateRechargeOrderRemarkParams {
    order_id?: string | number;
    order_no?: string;
    user_remark: string; // 用户反馈信息
    token?: string;
}

export async function updateRechargeOrderRemark(params: UpdateRechargeOrderRemarkParams): Promise<ApiResponse> {
    const payload = new FormData();

    // 优先使用 order_id，回退到 order_no
    if (params.order_id) {
        payload.append('order_id', String(params.order_id));
    } else if (params.order_no) {
        payload.append('order_no', String(params.order_no));
    }

    payload.append('user_remark', params.user_remark);

    return authedFetch(API_ENDPOINTS.recharge.updateOrderRemark, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}


export interface SubmitWithdrawParams {
    payment_id?: string | number; // 用户收款账户 ID (兼容)
    payment_account_id?: string | number; // 兼容
    amount: number | string;
    pay_password?: string;
    token?: string;
    remark?: string;
}

export async function submitWithdraw(params: SubmitWithdrawParams): Promise<ApiResponse> {
    const payload = new FormData();
    // New API: payment_account_id, amount
    payload.append('payment_account_id', String(params.payment_account_id || params.payment_id));
    payload.append('amount', String(params.amount));

    if (params.pay_password) payload.append('pay_password', params.pay_password);
    if (params.remark) payload.append('remark', params.remark);

    return authedFetch(API_ENDPOINTS.recharge.submitWithdraw, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}

export async function submitStaticIncomeWithdraw(params: SubmitWithdrawParams): Promise<ApiResponse> {
    const payload = new FormData();
    payload.append('user_account_id', String(params.payment_id || params.payment_account_id));
    payload.append('money', String(params.amount));
    if (params.pay_password) payload.append('pay_password', params.pay_password);

    return authedFetch(API_ENDPOINTS.recharge.submitStaticIncomeWithdraw, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}

// 订单记录
export interface RechargeOrderItem {
    id: number;
    order_no: string;
    money: number;
    amount?: number | string; // 兼容
    status: number; // 0:待审核, 1:通过, 2:拒绝
    status_text: string;
    createtime: number;
    create_time?: number; // 兼容
    payment_type?: string;
    payment_type_text?: string;
    [key: string]: any;
}

export async function getMyRechargeOrders(params: { page?: number; limit?: number; status?: number; token?: string } = {}): Promise<ApiResponse<{ data: RechargeOrderItem[], total: number, last_page: number, current_page: number }>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.status !== undefined) search.set('status', String(params.status));


    const path = `${API_ENDPOINTS.recharge.getMyOrderList}?${search.toString()}`;
    return authedFetch<{ data: RechargeOrderItem[], total: number, last_page: number, current_page: number }>(path, {
        method: 'GET',
        token: params.token,
    });
}

export interface WithdrawRecordItem {
    id: number;
    amount: number | string;
    fee: number | string;
    actual_amount: number | string;
    account_type: string; // 'bank_card' | 'alipay' | 'wechat' | 'usdt'
    account_type_text: string;
    account_name: string;
    account_number: string;
    bank_name?: string;
    status: number; // 0=待审核, 1=审核通过, 2=审核拒绝, 3=已打款, 4=打款失败
    status_text: string;
    audit_reason?: string;
    pay_reason?: string;
    remark?: string;
    create_time: number;
    create_time_text: string;
    audit_time?: number;
    audit_time_text?: string;
    pay_time?: number;
    pay_time_text?: string;
    // 兼容旧字段
    order_no?: string;
    money?: number;
    createtime?: number;
}

export async function getMyWithdrawList(params: { page?: number; limit?: number; status?: number; token?: string } = {}): Promise<ApiResponse<{
    data: WithdrawRecordItem[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.status !== undefined) search.set('status', String(params.status));

    const path = `${API_ENDPOINTS.recharge.getMyWithdrawList}?${search.toString()}`;

    interface WithdrawListResponse {
        data: WithdrawRecordItem[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    }

    return authedFetch<WithdrawListResponse>(path, {
        method: 'GET',
        token: params.token,
    });
}

// 充值订单详情
export interface RechargeOrderDetail {
    id: number;
    order_no: string;
    amount: number;
    payment_type: string;
    payment_type_text?: string;
    status: number;
    status_text: string;
    payment_screenshot?: string;
    audit_remark?: string;
    create_time: number;
    create_time_text: string;
    audit_time?: number;
    audit_time_text?: string;
    [key: string]: any;
}

export async function getRechargeOrderDetail(id: number | string, token?: string): Promise<ApiResponse<RechargeOrderDetail>> {
    const search = new URLSearchParams();
    search.set('id', String(id));

    const path = `${API_ENDPOINTS.recharge.detail}?${search.toString()}`;
    return authedFetch<RechargeOrderDetail>(path, {
        method: 'GET',
        token,
    });
}

// 余额划转相关
export interface TransferIncomeToPurchaseParams {
    amount: number | string;
    remark?: string;
    token?: string;
}

export interface TransferIncomeToPurchaseResponse {
    transfer_amount: number;
    remaining_withdrawable: number;
    new_balance_available: number;
}

export async function transferIncomeToPurchase(params: TransferIncomeToPurchaseParams): Promise<ApiResponse<TransferIncomeToPurchaseResponse>> {
    if (!params.amount || Number(params.amount) <= 0) {
        throw new Error('请输入有效的划转金额');
    }

    const payload: Record<string, any> = {
        amount: Number(params.amount),
    };
    if (params.remark) payload.remark = params.remark;

    return authedFetch<TransferIncomeToPurchaseResponse>(API_ENDPOINTS.financeOrder.transferIncomeToPurchase, {
        method: 'POST',
        body: JSON.stringify(payload),
        token: params.token,
    });
}

// ========== 账户一览（Account Overview）相关 ==========

/**
 * 账户余额信息
 */
export interface AccountBalanceInfo {
    /** 可用余额 */
    balance_available: string;
    /** 可提现金额 */
    withdrawable_money: string;
    /** 消费金 */
    score: number;
    /** 服务费余额 */
    service_fee_balance: string;
    /** 绿色算力 */
    green_power: string;
    /** 总资产 */
    total_assets: string;
}

/**
 * 收益项信息（可提现收益 + 消费金收益）
 */
export interface IncomeItemInfo {
    /** 可提现收益 */
    withdrawable_income: string;
    /** 消费金收益 */
    score_income: number;
}

/**
 * 历史收益统计
 */
export interface AccountIncomeInfo {
    /** 寄售收益 */
    consignment_income: IncomeItemInfo;
    /** 矿机分红 */
    mining_dividend: IncomeItemInfo;
    /** 好友分润（直推佣金、间推佣金、代理团队奖） */
    friend_commission: IncomeItemInfo;
    /** 签到奖励 */
    sign_in: IncomeItemInfo;
    /** 注册奖励 */
    register_reward: IncomeItemInfo;
    /** 其他收益 */
    other: IncomeItemInfo;
    /** 累计可提现收益总额 */
    total_income_withdrawable: string;
    /** 累计消费金收益总额 */
    total_income_score: number;
}

/**
 * 藏品价值统计
 */
export interface CollectionInfo {
    /** 藏品总数 */
    total_count: number;
    /** 藏品总价值 */
    total_value: string;
    /** 平均价格 */
    avg_price: string;
    /** 持有中数量 */
    holding_count: number;
    /** 寄售中数量 */
    consigning_count: number;
    /** 已售出数量 */
    sold_count: number;
    /** 矿机数量 */
    mining_count: number;
    /** 矿机总价值 */
    mining_value: string;
}

/**
 * 账户一览完整数据
 */
export interface AccountOverviewData {
    /** 账户余额信息 */
    balance: AccountBalanceInfo;
    /** 历史收益统计 */
    income: AccountIncomeInfo;
    /** 藏品价值统计 */
    collection: CollectionInfo;
}

/**
 * 获取账户一览数据（余额、历史收益、藏品统计）
 * @param token 可选的用户 token，若不传会自动从 localStorage 获取
 * @returns 账户一览数据
 */
export async function fetchAccountOverview(token?: string): Promise<ApiResponse<AccountOverviewData>> {
    return authedFetch<AccountOverviewData>(API_ENDPOINTS.account.accountOverview, {
        method: 'GET',
        token,
    });
}

// ============================================================================
// 算力兑换配置
// ============================================================================

/**
 * 算力兑换配置数据
 */
export interface ExchangeConfigData {
    /** 标准兑换比例（消费金/算力） */
    standard_rate: number;
    /** 补贴兑换比例 */
    subsidized_rate: number;
    /** 快捷金额选项 */
    quick_amounts: number[];
    /** 最小兑换金额 */
    min_amount: number;
    /** 最大兑换金额 */
    max_amount: number;
    /** 每日限额 */
    daily_limit: number;
    /** 提示文案 */
    tips: string[];
}

/**
 * 获取算力兑换配置
 * API: GET /api/Account/exchangeConfig
 * 
 * @param token 可选的用户 token，若不传会自动从 localStorage 获取
 * @returns 算力兑换配置（兑换比例、金额限制、提示文案）
 */
export async function fetchExchangeConfig(token?: string): Promise<ApiResponse<ExchangeConfigData>> {
    return authedFetch<ExchangeConfigData>(API_ENDPOINTS.account.exchangeConfig, {
        method: 'GET',
        token,
    });
}
