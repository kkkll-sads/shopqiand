import { API_ENDPOINTS } from './api-endpoints';
import { authedFetch, publicFetch } from './client';
import type { ApiResponse } from './networking';

export interface ActiveRankEvent {
  id: number;
  title: string;
  start_time: number;
  end_time: number;
  team_quota: number;
  update_interval_sec: number;
}

export interface ActiveRankTopItem {
  rank: number;
  team_id: number;
  team_name: string;
  contribution_value: number;
  reward_tier: number;
  reward_label?: string;
  reached_at?: number;
}

export interface ActiveRankMyData {
  team_id: number;
  team_name: string;
  rank: number;
  contribution_value: number;
  reward_tier: number;
  reward_label?: string;
}

export interface ActiveRankOverviewData {
  event: ActiveRankEvent | null;
  top: ActiveRankTopItem[];
  my: ActiveRankMyData | null;
  updated_at: number;
}

export interface ActiveRankRulesData {
  title: string;
  rules_text: string;
}

export async function fetchActiveRankOverview(token?: string): Promise<ApiResponse<ActiveRankOverviewData>> {
  return authedFetch<ActiveRankOverviewData>(API_ENDPOINTS.activeRank.overview, {
    method: 'GET',
    token,
  });
}

export async function fetchActiveRankTop(limit: number = 50, token?: string): Promise<ApiResponse<ActiveRankTopItem[]>> {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const search = new URLSearchParams();
  search.set('limit', String(safeLimit));
  return authedFetch<ActiveRankTopItem[]>(`${API_ENDPOINTS.activeRank.top}?${search.toString()}`, {
    method: 'GET',
    token,
  });
}

export async function fetchActiveRankMy(token?: string): Promise<ApiResponse<ActiveRankMyData | null>> {
  return authedFetch<ActiveRankMyData | null>(API_ENDPOINTS.activeRank.my, {
    method: 'GET',
    token,
  });
}

export async function fetchActiveRankRules(): Promise<ApiResponse<ActiveRankRulesData>> {
  return publicFetch<ActiveRankRulesData>(API_ENDPOINTS.activeRank.rules, {
    method: 'GET',
  });
}
