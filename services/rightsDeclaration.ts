import { ApiResponse } from './networking';
import { authedFetch, getStoredToken } from './client';

export interface RightsDeclarationSubmitParams {
    voucher_type: 'screenshot' | 'transfer_record' | 'other';
    amount: number;
    images: string[]; // 图片链接数组
    remark?: string;
}

export interface RightsDeclarationRecord {
    id: number;
    voucher_type: 'screenshot' | 'transfer_record' | 'other';
    voucher_type_text: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    status_text: string;
    images_array: string[];
    create_time_text: string;
    review_time_text: string;
    remark?: string;
    review_remark?: string;
}

export interface RightsDeclarationListParams {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export interface RightsDeclarationListResponse {
    list: RightsDeclarationRecord[];
    total: number;
    page: number;
    limit: number;
}

export interface RightsDeclarationReviewStatusResponse {
    list: RightsDeclarationRecord[];
    total: number;
    pending_count: number;
    approved_count: number;
    page: number;
    limit: number;
}

export interface RightsDeclarationDetail {
    id: number;
    voucher_type: 'screenshot' | 'transfer_record' | 'other';
    voucher_type_text: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    status_text: string;
    images_array: string[];
    remark?: string;
    review_remark?: string;
    create_time_text: string;
    review_time_text: string;
}

/**
 * 提交确权申报
 */
export async function submitRightsDeclaration(params: RightsDeclarationSubmitParams, token?: string): Promise<ApiResponse<{ declaration_id: number }>> {
    const authToken = token ?? getStoredToken();

    if (!authToken) {
        throw new Error('未找到用户登录信息，请先登录后再提交确权申报');
    }

    const amount = Number(params.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('请填写有效的确权金额');
    }

    if (!params.images || params.images.length === 0) {
        throw new Error('请至少上传一张凭证图片');
    }

    return authedFetch('/rightsDeclaration/submit', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
            voucher_type: params.voucher_type,
            amount,
            images: params.images, // 图片URL数组
            remark: params.remark || '',
        }),
    });
}

/**
 * 获取申报记录列表
 */
export async function getRightsDeclarationList(params: RightsDeclarationListParams = {}, token?: string): Promise<ApiResponse<RightsDeclarationListResponse>> {
    const authToken = token ?? getStoredToken();
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    return authedFetch(`/rightsDeclaration/list?${queryParams.toString()}`, {
        method: 'GET',
        token: authToken,
    });
}

/**
 * 获取申报详情
 */
export async function getRightsDeclarationDetail(id: number, token?: string): Promise<ApiResponse<{ detail: RightsDeclarationDetail }>> {
    const authToken = token ?? getStoredToken();
    return authedFetch(`/rightsDeclaration/detail?id=${id}`, {
        method: 'GET',
        token: authToken,
    });
}

/**
 * 撤销确权申报
 */
export async function cancelRightsDeclaration(id: number, token?: string, reason?: string): Promise<ApiResponse> {
    const authToken = token ?? getStoredToken();
    return authedFetch('/rightsDeclaration/cancel', {
        method: 'POST',
        token: authToken,
        body: JSON.stringify({
            id,
            reason: reason || '',
        }),
    });
}

/**
 * 获取确权审核状态
 */
export async function getRightsDeclarationReviewStatus(params: RightsDeclarationListParams = {}, token?: string): Promise<ApiResponse<RightsDeclarationReviewStatusResponse>> {
    const authToken = token ?? getStoredToken();
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    return authedFetch(`/rightsDeclaration/reviewStatus?${queryParams.toString()}`, {
        method: 'GET',
        token: authToken,
    });
}