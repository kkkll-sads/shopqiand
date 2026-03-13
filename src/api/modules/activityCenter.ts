import { createApiHeaders } from '../core/headers';
import { http } from '../http';

export interface ActivityCenterReward {
  type: string;
  value: number;
  name: string;
}

export interface ActivityCenterItem {
  key: string;
  title: string;
  desc: string;
  icon: string;
  status: number;
  btn_text: string;
  app_path: string;
  rewards: ActivityCenterReward[];
}

export interface ActivityCenterData {
  list: ActivityCenterItem[];
}

interface ActivityCenterRewardRaw {
  type?: string;
  value?: number | string;
  name?: string;
}

interface ActivityCenterItemRaw {
  key?: string;
  title?: string;
  desc?: string;
  icon?: string;
  status?: number | string;
  btn_text?: string;
  app_path?: string;
  rewards?: ActivityCenterRewardRaw[];
}

interface ActivityCenterResponseRaw {
  list?: ActivityCenterItemRaw[];
}

function readNumber(value: number | string | undefined, fallback = 0): number {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: string | undefined): string {
  return typeof value === 'string' ? value : '';
}

function normalizeReward(item: ActivityCenterRewardRaw): ActivityCenterReward {
  return {
    type: readString(item.type),
    value: readNumber(item.value),
    name: readString(item.name),
  };
}

function normalizeItem(item: ActivityCenterItemRaw): ActivityCenterItem {
  return {
    key: readString(item.key),
    title: readString(item.title),
    desc: readString(item.desc),
    icon: readString(item.icon),
    status: readNumber(item.status),
    btn_text: readString(item.btn_text),
    app_path: readString(item.app_path),
    rewards: Array.isArray(item.rewards) ? item.rewards.map(normalizeReward) : [],
  };
}

export const activityCenterApi = {
  /**
   * Activity center list
   * GET /api/ActivityCenter/index
   */
  async getList(signal?: AbortSignal): Promise<ActivityCenterData> {
    const response = await http.get<ActivityCenterResponseRaw>('/api/ActivityCenter/index', {
      headers: createApiHeaders(),
      signal,
    });

    return {
      list: Array.isArray(response.list) ? response.list.map(normalizeItem) : [],
    };
  },
};
