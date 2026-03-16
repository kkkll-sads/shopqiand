import { createApiHeaders } from '../core/headers';
import { http } from '../http';
import { resolveUploadUrl } from './upload';

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
  level1_active_count: number;
  level2_active_count: number;
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
  /** 用户等级数值 0=L0, 1=L1, ..., 5=L5 */
  user_level?: number;
  /** 等级文案 如 L0共识节点、L1社区节点 等 */
  user_level_text?: string;
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

function normalizeAssetUrl(url: string | undefined): string {
  if (typeof url !== 'string') {
    return '';
  }

  const nextUrl = url.trim();
  if (!nextUrl) {
    return '';
  }

  return resolveUploadUrl(nextUrl);
}

function normalizeOverview(payload: TeamOverviewData): TeamOverviewData {
  return {
    ...payload,
    invite_link: normalizeAssetUrl(payload.invite_link),
    qrcode_url: normalizeAssetUrl(payload.qrcode_url),
  };
}

function normalizeMember(member: TeamMember): TeamMember {
  return {
    ...member,
    avatar: normalizeAssetUrl(member.avatar),
  };
}

function normalizePromotionCard(payload: PromotionCardData): PromotionCardData {
  return {
    ...payload,
    invite_link: normalizeAssetUrl(payload.invite_link),
    qrcode_url: normalizeAssetUrl(payload.qrcode_url),
    user_info: {
      ...payload.user_info,
      avatar: normalizeAssetUrl(payload.user_info?.avatar),
    },
  };
}

function normalizeMemberDetail(payload: MemberDetailData): MemberDetailData {
  return {
    ...payload,
    user_info: {
      ...payload.user_info,
      avatar: normalizeAssetUrl(payload.user_info?.avatar),
    },
  };
}

export const teamApi = {
  /**
   * 我的团队概览
   * GET /api/Team/overview
   */
  async getOverview(signal?: AbortSignal): Promise<TeamOverviewData> {
    const payload = await http.get<TeamOverviewData>('/api/Team/overview', {
      headers: createApiHeaders(),
      signal,
    });
    return normalizeOverview(payload);
  },

  /**
   * 团队成员列表
   * GET /api/Team/members
   * @param params.user_type - 用于计算/筛选用户等级（可选）
   */
  async getMembers(
    params: {
      level?: number;
      page?: number;
      page_size?: number;
      user_type?: number;
    } = {},
    signal?: AbortSignal,
  ): Promise<TeamMembersData> {
    const payload = await http.get<TeamMembersData>('/api/Team/members', {
      headers: createApiHeaders(),
      query: params,
      signal,
    });
    return {
      ...payload,
      list: (payload.list ?? []).map(normalizeMember),
    };
  },

  /**
   * 推广名片信息
   * GET /api/Team/promotionCard
   */
  async getPromotionCard(signal?: AbortSignal): Promise<PromotionCardData> {
    const payload = await http.get<PromotionCardData>('/api/Team/promotionCard', {
      headers: createApiHeaders(),
      signal,
    });
    return normalizePromotionCard(payload);
  },

  /**
   * 好友详情
   * GET /api/Team/memberDetail
   */
  async getMemberDetail(userId: number, signal?: AbortSignal): Promise<MemberDetailData> {
    const payload = await http.get<MemberDetailData>('/api/Team/memberDetail', {
      headers: createApiHeaders(),
      query: { user_id: userId },
      signal,
    });
    return normalizeMemberDetail(payload);
  },
};
