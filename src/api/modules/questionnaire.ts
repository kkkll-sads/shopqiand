import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';
import { resolveUploadUrl } from './upload';

export interface QuestionnaireRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

interface QuestionnaireItemRaw {
  id?: number | string;
  title?: string;
  content?: string;
  images?: string;
  status?: number | string;
  status_text?: string;
  create_time?: number | string;
  create_time_text?: string;
  reward_power?: number | string;
  admin_remark?: string;
}

interface QuestionnaireListRaw {
  list?: QuestionnaireItemRaw[];
  total?: number | string;
}

export interface QuestionnaireItem {
  id: number;
  title: string;
  content: string;
  images: string[];
  status: number;
  statusText: string;
  createTime: number;
  createTimeText: string;
  rewardPower: number;
  adminRemark: string;
}

export interface QuestionnaireList {
  list: QuestionnaireItem[];
  total: number;
}

function readNumber(value: number | string | undefined, fallback = 0) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: string | undefined, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const nextValue = value.trim();
  return nextValue || fallback;
}

function normalizeImages(value: string | undefined) {
  const nextValue = readString(value);
  if (!nextValue) {
    return [];
  }

  return nextValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => resolveUploadUrl(item));
}

function normalizeItem(payload: QuestionnaireItemRaw): QuestionnaireItem {
  return {
    id: readNumber(payload.id),
    title: readString(payload.title),
    content: readString(payload.content),
    images: normalizeImages(payload.images),
    status: readNumber(payload.status),
    statusText: readString(payload.status_text),
    createTime: readNumber(payload.create_time),
    createTimeText: readString(payload.create_time_text),
    rewardPower: readNumber(payload.reward_power),
    adminRemark: readString(payload.admin_remark),
  };
}

export const questionnaireApi = {
  async myList(
    params: { page?: number; limit?: number } = {},
    options: QuestionnaireRequestOptions = {},
  ): Promise<QuestionnaireList> {
    const payload = await http.get<QuestionnaireListRaw>('/api/Questionnaire/myList', {
      headers: createApiHeaders(options),
      query: {
        page: params.page,
        limit: params.limit,
      },
      signal: options.signal,
    });

    return {
      list: Array.isArray(payload.list) ? payload.list.map(normalizeItem) : [],
      total: readNumber(payload.total),
    };
  },

  async submit(
    payload: { title: string; content: string; images?: string[] },
    options: QuestionnaireRequestOptions = {},
  ): Promise<number> {
    const response = await http.post<{ id?: number | string }, { title: string; content: string; images?: string }>(
      '/api/Questionnaire/submit',
      {
        title: payload.title,
        content: payload.content,
        images: payload.images?.join(','),
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return readNumber(response.id);
  },
};
