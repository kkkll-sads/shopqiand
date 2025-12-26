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

export async function getBalanceLog(params: GetBalanceLogParams = {}): Promise<ApiResponse<BalanceLogListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.account.balance}?${search.toString()}`;
    return authedFetch<BalanceLogListData>(path, {
        method: 'GET',
        token: params.token,
    });
}

export interface AllLogItem {
    id: number;
    amount: number | string; // 可能是 + 或 -
    memo: string;
    createtime: number;
    type: 'balance_available' | 'withdrawable_money' | 'service_fee_balance' | 'score' | string;
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
}

export async function getAllLog(params: GetAllLogParams = {}): Promise<ApiResponse<AllLogListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.type) search.set('type', params.type);

    const path = `${API_ENDPOINTS.account.allLog}?${search.toString()}`;
    return authedFetch<AllLogListData>(path, {
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

export async function getServiceFeeLog(params: GetServiceFeeLogParams = {}): Promise<ApiResponse<ServiceFeeLogListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.account.serviceFeeLog}?${search.toString()}`;
    return authedFetch<ServiceFeeLogListData>(path, {
        method: 'GET',
        token: params.token,
    });
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
    source?: 'withdrawable_money' | '';
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
    bank_name: string;
    bank_account: string; // 户名
    bank_card: string; // 卡号
    bank_address: string;
    min_recharge: string;
    max_recharge: string;
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
    remark?: string;
    token?: string;
}

export async function submitRechargeOrder(params: SubmitRechargeOrderParams): Promise<ApiResponse> {
    const payload = new FormData();
    payload.append('company_account_id', String(params.company_account_id));
    payload.append('amount', String(params.amount));

    // 兼容不同的图片字段
    const image = params.voucher || params.payment_screenshot;
    if (image) payload.append('payment_screenshot', image);

    if (params.remark) payload.append('remark', params.remark);
    if (params.payment_type) payload.append('payment_type', params.payment_type);

    return authedFetch(API_ENDPOINTS.recharge.submitOrder, {
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

export async function getMyRechargeOrders(params: { page?: number; limit?: number; token?: string } = {}): Promise<ApiResponse<{ list: RechargeOrderItem[], has_more?: boolean }>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.recharge.getMyOrderList}?${search.toString()}`;
    return authedFetch<{ list: RechargeOrderItem[], has_more?: boolean }>(path, {
        method: 'GET',
        token: params.token,
    });
}

// 兼容旧名称
export const getMyOrderList = getMyRechargeOrders;


export interface WithdrawRecordItem {
    id: number;
    order_no: string;
    money: number;
    amount?: number | string; // 兼容
    actual_amount?: number | string;
    fee?: number | string;
    status: number;
    status_text: string;
    createtime: number;
    create_time?: number; // 兼容
    [key: string]: any;
}

// 兼容旧名称
export type WithdrawOrderItem = WithdrawRecordItem;

export async function getMyWithdrawList(params: { page?: number; limit?: number; token?: string } = {}): Promise<ApiResponse<{ list: WithdrawRecordItem[], has_more?: boolean }>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.recharge.getMyWithdrawList}?${search.toString()}`;
    return authedFetch<{ list: WithdrawRecordItem[], has_more?: boolean }>(path, {
        method: 'GET',
        token: params.token,
    });
}
