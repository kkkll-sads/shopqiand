import { createApiHeaders } from '../core/headers';
import { http } from '../http';

export interface TeamOverviewData {
  balance: number;
  total_money: number;
  usdt: number;
  static_income: number;
  dynamic_income: number;
  invite_code: string;
  invite_link: string;
  qrcode_url: string;
  team_total: number;
  today_register: number;
  big_area_performance: number;
  small_area_performance: number;
  level1_count: number;
  level2_count: number;
  level3_count: number;
}

export interface TeamMember {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  mobile: string;
  register_time: string;
  level: number;
  level_text: string;
}

export interface TeamMembersData {
  total: number;
  page: number;
  page_size: number;
  list: TeamMember[];
}

export interface PromotionCardData {
  user_info: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
    mobile: string;
  };
  invite_code: string;
  invite_link: string;
  qrcode_url: string;
  team_count: number;
  total_performance: number;
}

export interface MemberDetailData {
  user_info: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
    register_time: string;
  };
  level: number;
  level_text: string;
  consignment_income: {
    withdrawable_income: number;
    score_income: number;
  };
}

export const teamApi = {
  /**
   * 我的团队概览
   * GET /api/Team/overview
   */
  async getOverview(signal?: AbortSignal): Promise<TeamOverviewData> {
    return http.get<TeamOverviewData>('/api/Team/overview', {
      headers: createApiHeaders(),
      signal,
    });
  },

  /**
   * 团队成员列表
   * GET /api/Team/members
   */
  async getMembers(
    params: { level?: number; page?: number; page_size?: number } = {},
    signal?: AbortSignal,
  ): Promise<TeamMembersData> {
    return http.get<TeamMembersData>('/api/Team/members', {
      headers: createApiHeaders(),
      query: params,
      signal,
    });
  },

  /**
   * 推广名片信息
   * GET /api/Team/promotionCard
   */
  async getPromotionCard(signal?: AbortSignal): Promise<PromotionCardData> {
    return http.get<PromotionCardData>('/api/Team/promotionCard', {
      headers: createApiHeaders(),
      signal,
    });
  },

  /**
   * 好友详情
   * GET /api/Team/memberDetail
   */
  async getMemberDetail(userId: number, signal?: AbortSignal): Promise<MemberDetailData> {
    return http.get<MemberDetailData>('/api/Team/memberDetail', {
      headers: createApiHeaders(),
      query: { user_id: userId },
      signal,
    });
  },
};
