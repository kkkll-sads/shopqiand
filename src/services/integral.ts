import { ApiResponse } from './networking';
import { getStoredToken } from './client';
import { getAllLog } from './wallet';

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
 * 获取消费金日志（已迁移：统一走 allLog）
 * 替代废弃接口 /Account/integral
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

    const res = await getAllLog({
        page: 1,
        limit,
        type: 'score',
        token,
    });
    return res as unknown as ApiResponse<IntegralLogData>;
}
