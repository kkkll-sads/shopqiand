import { apiFetch, ApiResponse } from './networking';
import { API_ENDPOINTS, AUTH_TOKEN_KEY } from './config';
import { ProfileResponse, PromotionCardData, TeamMembersListData } from '../types';

/**
 * 获取个人中心信息
 * @param token 用户 Token
 */
export async function fetchProfile(token: string): Promise<ApiResponse<ProfileResponse>> {
    try {
        const data = await apiFetch<ProfileResponse>(API_ENDPOINTS.account.profile, {
            method: 'GET',
            token,
        });
        console.log('个人中心接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('获取个人中心信息失败:', error);
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            const corsError = new Error('网络请求失败，可能是跨域问题或服务器不可达。请检查：\n1. API 服务器是否正常运行\n2. 是否配置了 CORS 允许跨域\n3. 网络连接是否正常');
            (corsError as any).isCorsError = true;
            throw corsError;
        }
        throw error;
    }
}

export interface UpdateAvatarParams {
    avatar?: string;
    avatar_url?: string;
    token?: string;
}

export async function updateAvatar(params: UpdateAvatarParams): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再尝试修改头像');
    }

    const payload = {
        avatar: params.avatar || '',
        avatar_url: params.avatar_url || '',
    };

    try {
        const data = await apiFetch(API_ENDPOINTS.user.updateAvatar, {
            method: 'POST',
            body: JSON.stringify(payload),
            token,
        });
        console.log('修改头像接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('修改头像失败:', error);
        throw error;
    }
}

export interface UpdateNicknameParams {
    nickname: string;
    token?: string;
}

export async function updateNickname(params: UpdateNicknameParams): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再尝试修改昵称');
    }

    if (!params.nickname?.trim()) {
        throw new Error('请输入合法的昵称');
    }

    const payload = new FormData();
    payload.append('nickname', params.nickname.trim());

    try {
        const data = await apiFetch(API_ENDPOINTS.user.updateNickname, {
            method: 'POST',
            body: payload,
            token,
        });
        console.log('修改昵称接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('修改昵称失败:', error);
        throw error;
    }
}

export interface UpdatePasswordParams {
    old_password: string;
    new_password: string;
    token?: string;
}

export async function updatePassword(params: UpdatePasswordParams): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再尝试修改密码');
    }

    const oldPassword = params.old_password?.trim();
    const newPassword = params.new_password?.trim();

    if (!oldPassword) {
        throw new Error('请输入旧密码');
    }

    if (!newPassword) {
        throw new Error('请输入新密码');
    }

    if (newPassword.length < 6) {
        throw new Error('新密码长度至少 6 位');
    }

    if (newPassword === oldPassword) {
        throw new Error('新密码不能与旧密码相同');
    }

    const payload = new FormData();
    payload.append('old_password', oldPassword);
    payload.append('new_password', newPassword);

    try {
        const data = await apiFetch(API_ENDPOINTS.user.updatePassword, {
            method: 'POST',
            body: payload,
            token,
        });
        console.log('修改登录密码接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('修改登录密码失败:', error);
        throw error;
    }
}

export interface UpdatePayPasswordParams {
    old_pay_password: string;
    new_pay_password: string;
    token?: string;
}

export async function updatePayPassword(params: UpdatePayPasswordParams): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再尝试修改支付密码');
    }

    const oldPayPassword = params.old_pay_password?.trim();
    const newPayPassword = params.new_pay_password?.trim();

    if (!oldPayPassword) {
        throw new Error('请输入旧支付密码');
    }

    if (!newPayPassword) {
        throw new Error('请输入新支付密码');
    }

    if (newPayPassword.length < 6) {
        throw new Error('新支付密码长度至少 6 位');
    }

    if (newPayPassword === oldPayPassword) {
        throw new Error('新支付密码不能与旧支付密码相同');
    }

    const payload = new FormData();
    payload.append('old_pay_password', oldPayPassword);
    payload.append('new_pay_password', newPayPassword);

    try {
        const data = await apiFetch(API_ENDPOINTS.user.updatePayPassword, {
            method: 'POST',
            body: payload,
            token,
        });
        console.log('修改支付密码接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('修改支付密码失败:', error);
        throw error;
    }
}

export interface CancelAccountParams {
    password: string;
    reason?: string;
    token?: string;
}

export async function cancelAccount(params: CancelAccountParams): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再尝试注销账户');
    }

    const password = params.password?.trim();
    const reason = params.reason?.trim() ?? '';

    if (!password) {
        throw new Error('请输入登录密码以确认注销');
    }

    const payload = new FormData();
    payload.append('password', password);
    payload.append('reason', reason);

    try {
        const data = await apiFetch(API_ENDPOINTS.account.cancelAccount, {
            method: 'POST',
            body: payload,
            token,
        });
        console.log('账户注销接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('提交账户注销申请失败:', error);
        throw error;
    }
}




// 实名认证相关
export interface RealNameStatusData {
    real_name_status: number; // 0:未认证, 1:审核中, 2:已通过, 3:已驳回
    real_name?: string;
    id_card?: string;
    audit_reason?: string;
    id_card_front?: string;
    id_card_back?: string;
    audit_time?: string;
}

export async function fetchRealNameStatus(token: string): Promise<ApiResponse<RealNameStatusData>> {
    return apiFetch<RealNameStatusData>(API_ENDPOINTS.user.realNameStatus, {
        method: 'GET',
        token,
    });
}

export interface SubmitRealNameParams {
    real_name?: string;
    id_card?: string;
    id_card_front?: string;
    id_card_back?: string;
    auth_token?: string; // H5人脸核身返回的token
    token?: string;
}

export async function submitRealName(params: SubmitRealNameParams): Promise<ApiResponse<{ real_name_status?: number }>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();

    if (params.auth_token) {
        payload.append('auth_token', params.auth_token);
    } else {
        if (params.real_name) payload.append('real_name', params.real_name);
        if (params.id_card) payload.append('id_card', params.id_card);
        if (params.id_card_front) payload.append('id_card_front', params.id_card_front);
        if (params.id_card_back) payload.append('id_card_back', params.id_card_back);
    }

    return apiFetch(API_ENDPOINTS.user.submitRealName, {
        method: 'POST',
        body: payload,
        token,
    });
}

export interface LivePersonCheckParams {
    name: string;
    cardNo: string;
    token: string;
    needAvatar?: boolean | string; // 'true'/'false' or boolean
    picType?: number;
    dataId?: string;
    userToken?: string; // Optional user token override
}

export interface LivePersonCheckResult {
    status: number; // 1=pass, 2=fail, 0=pending
    statusDesc?: string;
    faceMatched?: number; // 1=pass, 2=fail, 0=uncertain
    similarityScore?: number;
    reasonTypeDesc?: string;
    [key: string]: any;
}

export async function livePersonCheck(params: LivePersonCheckParams): Promise<ApiResponse<LivePersonCheckResult>> {
    const token = params.userToken || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new URLSearchParams();
    payload.append('name', params.name);
    payload.append('cardNo', params.cardNo);
    payload.append('token', params.token);

    if (params.needAvatar !== undefined) {
        payload.append('needAvatar', String(params.needAvatar));
    }
    if (params.picType !== undefined) {
        payload.append('picType', String(params.picType));
    }
    if (params.dataId) {
        payload.append('dataId', params.dataId);
    }

    return apiFetch<LivePersonCheckResult>(API_ENDPOINTS.yidun.livePersonCheck, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
        token,
    });
}

export interface H5AuthTokenParams {
    real_name: string;
    id_card: string;
    redirect_url: string;
    token?: string;
}

export interface H5AuthTokenResult {
    authUrl: string;
    authToken: string;
}

export async function fetchH5AuthToken(params: H5AuthTokenParams): Promise<ApiResponse<H5AuthTokenResult>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();
    payload.append('real_name', params.real_name);
    payload.append('id_card', params.id_card);
    payload.append('redirect_url', params.redirect_url);

    return apiFetch<H5AuthTokenResult>(API_ENDPOINTS.user.getH5AuthToken, {
        method: 'POST',
        body: payload,
        token,
    });
}

/**
 * H5人脸核身校验接口
 * 使用 authToken 获取核身结果
 */
export interface H5RecheckParams {
    authToken: string;
    token?: string;
}

export interface H5RecheckResult {
    taskId?: string;
    picType?: number;
    avatar?: string;
    status: number; // 1=通过, 2=不通过, 0=待定
    reasonType?: number;
    isPayed?: number;
    similarityScore?: number;
    faceMatched?: number; // 1=通过, 2=不通过, 0=不确定
    faceAttributeInfo?: any;
    extInfo?: any;
    reasonTypeDesc?: string;
    statusDesc?: string;
}

export async function h5Recheck(params: H5RecheckParams): Promise<ApiResponse<H5RecheckResult>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new URLSearchParams();
    payload.append('authToken', params.authToken);

    return apiFetch<H5RecheckResult>(API_ENDPOINTS.yidun.h5Recheck, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
        token,
    });
}

// 推广相关
export async function fetchPromotionCard(token: string): Promise<ApiResponse<PromotionCardData>> {
    return apiFetch<PromotionCardData>(API_ENDPOINTS.team.promotionCard, {
        method: 'GET',
        token,
    });
}

export interface FetchTeamMembersParams {
    page?: number;
    limit?: number;
    page_size?: number; // Alias for limit
    level?: 1 | 2;
    token?: string;
}

export async function fetchTeamMembers(
    params: FetchTeamMembersParams = {},
): Promise<ApiResponse<TeamMembersListData>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.page) search.set('page', String(params.page));
    const limit = params.limit || params.page_size;
    if (limit) search.set('limit', String(limit));
    if (params.level) search.set('level', String(params.level));

    const path = `${API_ENDPOINTS.team.members}?${search.toString()}`;
    return apiFetch<TeamMembersListData>(path, {
        method: 'GET',
        token,
    });
}

export interface AgentReviewStatusData {
    id: number;
    user_id: number;
    status: '0' | '1' | '2'; // 0:审核中, 1:通过, 2:拒绝
    status_text?: string;
    apply_time: string;
    review_time?: string;
    review_reason?: string;
    audit_remark?: string;
    company_name?: string;
    legal_person?: string;
    legal_id_number?: string;
    subject_type?: number;
    license_image?: string;
    [key: string]: any;
}

export async function fetchAgentReviewStatus(token: string): Promise<ApiResponse<AgentReviewStatusData | null>> {
    return apiFetch<AgentReviewStatusData | null>(API_ENDPOINTS.user.agentReviewStatus, {
        method: 'GET',
        token,
    });
}

export interface SubmitAgentReviewParams {
    name?: string; // Opt
    phone?: string; // Opt
    company_name?: string;
    legal_person?: string;
    legal_id_number?: string;
    subject_type?: number;
    license_image?: string;
    reason?: string;
    token?: string;
}

export async function submitAgentReview(params: SubmitAgentReviewParams): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();
    if (params.name) payload.append('name', params.name);
    if (params.phone) payload.append('phone', params.phone);
    if (params.company_name) payload.append('company_name', params.company_name);
    if (params.legal_person) payload.append('legal_person', params.legal_person);
    if (params.legal_id_number) payload.append('legal_id_number', params.legal_id_number);
    if (params.subject_type) payload.append('subject_type', String(params.subject_type));
    if (params.license_image) payload.append('license_image', params.license_image);
    if (params.reason) payload.append('reason', params.reason);

    return apiFetch(API_ENDPOINTS.user.submitAgentReview, {
        method: 'POST',
        body: payload,
        token,
    });
}

// 收货地址相关
export interface AddressItem {
    id: number;
    user_id?: number;
    name: string;       // 收货人姓名
    phone: string;      // 手机号
    province: string;   // 省份
    city: string;       // 城市
    district?: string;  // 区/县
    address: string;    // 详细地址
    is_default: number | string; // 1: 默认, 0: 非默认
    region_text?: string; // 前端组合显示的地区文本
    detail?: string;
    [key: string]: any;
}

export interface AddressListData {
    list: AddressItem[];
    [key: string]: any;
}

export async function fetchAddressList(token: string): Promise<ApiResponse<AddressListData>> {
    return apiFetch<AddressListData>(API_ENDPOINTS.address.list, {
        method: 'GET',
        token,
    });
}

export interface SaveAddressParams {
    id?: number | string; // 有 id 为编辑，无 id 为新增
    name: string;        // 收货人姓名
    phone: string;       // 手机号
    province: string;    // 省份
    city: string;        // 城市
    district?: string;   // 区/县
    address: string;     // 详细地址
    is_default: boolean | number; // 是否默认地址: 0=否, 1=是
    token?: string;
}

export async function saveAddress(params: SaveAddressParams): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();

    if (params.id) payload.append('id', String(params.id));
    payload.append('name', params.name);
    payload.append('phone', params.phone);
    payload.append('province', params.province);
    payload.append('city', params.city);
    payload.append('district', params.district || '');
    payload.append('address', params.address);
    payload.append('is_default', params.is_default ? '1' : '0');

    const url = params.id ? API_ENDPOINTS.address.edit : API_ENDPOINTS.address.add;
    return apiFetch(url, {
        method: 'POST',
        body: payload,
        token,
    });
}

export async function deleteAddress(params: { id: number | string; token?: string }): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();
    payload.append('id', String(params.id));

    return apiFetch(API_ENDPOINTS.address.delete, {
        method: 'POST',
        body: payload,
        token,
    });
}

export async function fetchDefaultAddress(token: string): Promise<ApiResponse<AddressItem>> {
    return apiFetch<AddressItem>(API_ENDPOINTS.address.getDefault, {
        method: 'GET',
        token,
    });
}

// -----------------------------------------------------------------------------
// 签到相关接口
// -----------------------------------------------------------------------------

/**
 * 签到活动配置
 */
export interface SignInConfig {
    daily_reward: number;
    referrer_reward: number;
    calendar_range_months: number;
    calendar_start: string;
    calendar_end: string;
}

/**
 * 签到活动信息
 */
export interface SignInActivity {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    register_reward: number;
    sign_reward_min: number;
    sign_reward_max: number;
    invite_reward_min: number;
    invite_reward_max: number;
    withdraw_min_amount: number;
    withdraw_daily_limit: number;
    withdraw_audit_hours: number;
}

/**
 * 签到规则项
 */
export interface SignInRule {
    key: string;
    title: string;
    description: string;
}

/**
 * 签到记录项
 */
export interface SignInRecordItem {
    id: number;
    sign_date: string;
    reward_score: number;
    reward_money: number;
    reward_type: string;
    create_time: number;
    config?: {
        daily_reward: number;
        referrer_reward: number;
    };
}

/**
 * 签到日历数据
 */
export interface SignInCalendar {
    start: string;
    end: string;
    signed_dates: string[];
    records: Array<{
        date: string;
        reward_score: number;
        record_id: number;
    }>;
}

/**
 * 签到信息数据
 */
export interface SignInInfoData {
    today_signed: boolean;
    today_reward: number;
    daily_reward: number;
    total_reward: number;
    sign_days: number;
    streak: number;
    calendar: SignInCalendar;
    recent_records: SignInRecordItem[];
    config: {
        daily_reward: number;
        referrer_reward: number;
    };
    activity: SignInActivity;
    reward_type: string;
}

/**
 * 执行签到响应数据
 */
export interface SignInDoData extends SignInInfoData {
    sign_record_id: number;
    sign_date: string;
    referrer_reward: number;
    message: string;
}

/**
 * 签到提现进度数据
 */
export interface SignInProgressData {
    withdrawable_money: number;
    withdraw_min_amount: number;
    progress: number;
    remaining_amount: number;
    can_withdraw: boolean;
    total_money: number;
    activity: {
        id: number;
        name: string;
        withdraw_min_amount: number;
        withdraw_daily_limit: number;
        withdraw_audit_hours: number;
    };
}

export interface SignInRulesData {
    config: SignInConfig;
    activity: SignInActivity;
    rules: SignInRule[];
}

export interface SignInRecordsData {
    total: number;
    page: number;
    page_size: number;
    total_score: number;
    total_money: number;
    is_today_signed: boolean;
    lucky_draw_info?: {
        current_draw_count: number;
        daily_limit: number;
        used_today: number;
        remaining_count: number;
    };
    lucky_draw_rules?: string;
    records: SignInRecordItem[];
}

// Functions

/**
 * 获取签到活动规则
 */
export async function fetchSignInRules(): Promise<ApiResponse<SignInRulesData>> {
    try {
        const data = await apiFetch<SignInRulesData>(API_ENDPOINTS.signIn.rules, {
            method: 'GET',
        });
        console.log('获取签到规则接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('获取签到规则失败:', error);
        throw error;
    }
}

/**
 * 获取签到信息
 */
export async function fetchSignInInfo(
    token: string
): Promise<ApiResponse<SignInInfoData>> {
    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再查看签到信息');
    }

    try {
        const data = await apiFetch<SignInInfoData>(API_ENDPOINTS.signIn.info, {
            method: 'GET',
            token,
        });
        console.log('获取签到信息接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('获取签到信息失败:', error);
        throw error;
    }
}

/**
 * 执行签到
 */
export async function doSignIn(
    token: string
): Promise<ApiResponse<SignInDoData>> {
    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再签到');
    }

    try {
        const data = await apiFetch<SignInDoData>(API_ENDPOINTS.signIn.do, {
            method: 'POST',
            body: JSON.stringify({}),
            token,
        });
        console.log('执行签到接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('执行签到失败:', error);
        throw error;
    }
}

/**
 * 获取签到提现进度
 */
export async function fetchSignInProgress(
    token: string
): Promise<ApiResponse<SignInProgressData>> {
    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再查看提现进度');
    }

    try {
        const data = await apiFetch<SignInProgressData>(API_ENDPOINTS.signIn.progress, {
            method: 'GET',
            token,
        });
        console.log('获取签到提现进度接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('获取签到提现进度失败:', error);
        throw error;
    }
}

export interface ExchangeScoreToGreenPowerParams {
    score: number | string;
    token?: string;
}

export interface ExchangeScoreToGreenPowerResult {
    score_consumed: number;
    green_power_gained: number;
    before_score: number;
    after_score: number;
    before_green_power: number;
    after_green_power: number;
    exchange_rate: number;
}

export async function exchangeScoreToGreenPower(params: ExchangeScoreToGreenPowerParams): Promise<ApiResponse<ExchangeScoreToGreenPowerResult>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    if (!params.score || Number(params.score) <= 0) {
        throw new Error('请输入有效的消费金数量');
    }

    const search = new URLSearchParams();
    search.set('score', String(params.score));

    const path = `${API_ENDPOINTS.account.exchangeScoreToGreenPower}?${search.toString()}`;

    return apiFetch<ExchangeScoreToGreenPowerResult>(path, {
        method: 'POST',
        token,
    });
}
