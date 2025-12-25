import { apiFetch, ApiResponse } from './networking';

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
export async function submitRightsDeclaration(params: RightsDeclarationSubmitParams, token: string): Promise<ApiResponse<{ declaration_id: number }>> {
    return apiFetch('/rightsDeclaration/submit', {
        method: 'POST',
        token,
        body: JSON.stringify({
            voucher_type: params.voucher_type,
            amount: params.amount,
            images: params.images, // 图片URL数组
            remark: params.remark || '',
        }),
    });
}

/**
 * 获取申报记录列表
 */
export async function getRightsDeclarationList(params: RightsDeclarationListParams = {}, token: string): Promise<ApiResponse<RightsDeclarationListResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    return apiFetch(`/rightsDeclaration/list?${queryParams.toString()}`, {
        method: 'GET',
        token,
    });
}

/**
 * 获取申报详情
 */
export async function getRightsDeclarationDetail(id: number, token: string): Promise<ApiResponse<{ detail: RightsDeclarationDetail }>> {
    return apiFetch(`/rightsDeclaration/detail?id=${id}`, {
        method: 'GET',
        token,
    });
}

/**
 * 撤销确权申报
 */
export async function cancelRightsDeclaration(id: number, token: string, reason?: string): Promise<ApiResponse> {
    return apiFetch('/rightsDeclaration/cancel', {
        method: 'POST',
        token,
        body: JSON.stringify({
            id,
            reason: reason || '',
        }),
    });
}

/**
 * 获取确权审核状态
 */
export async function getRightsDeclarationReviewStatus(params: RightsDeclarationListParams = {}, token: string): Promise<ApiResponse<RightsDeclarationReviewStatusResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    return apiFetch(`/rightsDeclaration/reviewStatus?${queryParams.toString()}`, {
        method: 'GET',
        token,
    });
}