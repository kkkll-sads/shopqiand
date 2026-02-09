import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';
import type { PromotionCardData, TeamMembersListData } from '@/types';

// 推广相关
export async function fetchPromotionCard(token: string): Promise<ApiResponse<PromotionCardData>> {
  return authedFetch<PromotionCardData>(API_ENDPOINTS.team.promotionCard, {
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
  params: FetchTeamMembersParams = {}
): Promise<ApiResponse<TeamMembersListData>> {
  const token = params.token ?? getStoredToken();
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.page) search.set('page', String(params.page));
  const limit = params.limit || params.page_size;
  if (limit) search.set('limit', String(limit));
  if (params.level) search.set('level', String(params.level));

  const path = `${API_ENDPOINTS.team.members}?${search.toString()}`;
  return authedFetch<TeamMembersListData>(path, {
    method: 'GET',
    token,
  });
}

// 好友详情相关
export interface MemberDetailUserInfo {
  id: number;
  username: string; // 显示名称（已实名显示脱敏姓名，未实名显示"未实名"）
  nickname: string; // 用户昵称
  avatar: string; // 头像完整URL
  register_time: string; // 注册时间（格式：YYYY-MM-DD HH:mm:ss）
}

export interface MemberDetailConsignmentIncome {
  withdrawable_income: number; // 可提现收益（元，保留2位小数）
  score_income: number; // 消费金收益（积分）
}

export interface MemberDetailData {
  user_info: MemberDetailUserInfo;
  level: number; // 层级：1=一级直推，2=二级间推
  level_text: string; // 层级文本："一级 直推" 或 "二级 间推"
  consignment_income: MemberDetailConsignmentIncome;
}

export interface FetchMemberDetailParams {
  user_id: number;
  token?: string;
}

export async function fetchMemberDetail(
  params: FetchMemberDetailParams
): Promise<ApiResponse<MemberDetailData>> {
  const token = params.token ?? getStoredToken();
  const path = `${API_ENDPOINTS.team.memberDetail}?user_id=${params.user_id}`;
  return authedFetch<MemberDetailData>(path, {
    method: 'GET',
    token,
  });
}
