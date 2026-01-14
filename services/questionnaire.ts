
import { authedFetch } from './client';
import { ApiResponse } from './networking';

export interface PaginatedResponse<T> {
    total: number;
    last_page: number;
    per_page: number;
    current_page: number;
    data: T[];
    list?: T[]; // API sometimes returns list instead of data
}

/**
 * 提交问卷请求参数
 */
export interface SubmitQuestionnaireParams {
    title: string;
    content: string;
    images?: string; // 多张图片用逗号分隔
}

/**
 * 问卷列表项
 */
export interface QuestionnaireItem {
    id: number;
    title: string;
    content: string;
    status: number; // 0=待审核, 1=已采纳, 2=已拒绝
    status_text: string;
    create_time: number;
    create_time_text: string;
    reward_power: number; // 奖励算力
    admin_remark: string; // 管理员备注
    images?: string; // 图片列表，逗号分隔
    total?: number;
}

/**
 * 提交问卷
 */
export const submitQuestionnaire = async (data: SubmitQuestionnaireParams): Promise<ApiResponse<{ id: number }>> => {
    return authedFetch('/Questionnaire/submit', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * 获取我的问卷列表
 */
export const getMyQuestionnaireList = async (params: { page: number; limit: number }): Promise<ApiResponse<PaginatedResponse<QuestionnaireItem>>> => {
    const query = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
    }).toString();

    return authedFetch(`/Questionnaire/myList?${query}`, {
        method: 'GET',
    });
};
