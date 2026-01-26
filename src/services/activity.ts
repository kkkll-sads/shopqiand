
import { authedFetch } from './client';
import { ApiResponse } from './networking';

/**
 * 活动奖励项接口
 */
export interface ActivityReward {
    type: string; // e.g. 'score'
    value: number;
    name: string; // e.g. '消费金'
}

/**
 * 活动中心任务项接口
 */
export interface ActivityItem {
    key: string;            // 任务唯一标识, e.g. 'first_trade', 'invite'
    title: string;          // 任务标题
    status: number;         // 状态: 0=去完成, 1=领取奖励, 2=已完成
    btn_text: string;       // 按钮文案
    rewards: ActivityReward[]; // 奖励列表
}

/**
 * 获取活动中心数据
 */
export const getActivityList = async (): Promise<ApiResponse<{ list: ActivityItem[] }>> => {
    return authedFetch('/ActivityCenter/index', {
        method: 'GET',
    });
};
