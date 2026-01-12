import { ApiResponse } from './networking';
import { API_ENDPOINTS } from './config';
import { authedFetch, getStoredToken } from './client';

/**
 * 消费金日志项
 */
export interface IntegralLogItem {
    id: number;
    amount: number;
    before_value: number;
    after_value: number;
    remark: string;
    create_time: number;
}

/**
 * 消费金日志列表数据
 */
export interface IntegralLogData {
    list: IntegralLogItem[];
    total: number;
}

/**
 * 获取消费金日志参数
 */
export interface GetIntegralLogParams {
    limit?: number;
    token?: string;
}

/**
 * 获取消费金日志
 * 对应后端: /Account/integral
 * @param params 查询参数
 */
export async function getIntegralLog(
    params: GetIntegralLogParams = {},
): Promise<ApiResponse<IntegralLogData>> {
    const token = params.token ?? getStoredToken();
    const limit = params.limit || 10;

    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再查看消费金日志');
    }

    const search = new URLSearchParams();
    search.append('limit', String(limit));

    const path = `${API_ENDPOINTS.account.integral}?${search.toString()}`;

    try {
        const data = await authedFetch<IntegralLogData>(path, {
            method: 'GET',
            token,
        });
        console.log('获取消费金日志接口原始响应:', data);
        return data;
    } catch (error: any) {
        console.error('获取消费金日志失败:', error);
        throw error;
    }
}
