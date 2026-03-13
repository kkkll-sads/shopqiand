import { http } from '../http';

function readNumber(value: unknown, fallback = 0): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export interface HelpCategory {
  id: number;
  name: string;
  code: string;
}

export interface HelpQuestion {
  id: number;
  title: string;
  content: string;
  category_id: number;
}

export interface HelpCategoriesData {
  list: HelpCategory[];
}

export interface HelpQuestionsData {
  list: HelpQuestion[];
}

interface HelpCategoryRaw {
  id?: number | string;
  name?: string;
  code?: string;
}

interface HelpQuestionRaw {
  id?: number | string;
  title?: string;
  content?: string;
  category_id?: number | string;
}

function normalizeCategory(item: HelpCategoryRaw): HelpCategory {
  return {
    id: readNumber(item.id),
    name: readString(item.name),
    code: readString(item.code),
  };
}

function normalizeQuestion(item: HelpQuestionRaw): HelpQuestion {
  return {
    id: readNumber(item.id),
    title: readString(item.title),
    content: readString(item.content),
    category_id: readNumber(item.category_id),
  };
}

export const helpApi = {
  async getCategories(signal?: AbortSignal): Promise<HelpCategoriesData> {
    const response = await http.get<HelpCategoriesData | { list?: HelpCategoryRaw[] }>(
      '/api/Help/categories',
      { signal },
    );

    return {
      list: Array.isArray(response?.list) ? response.list.map(normalizeCategory) : [],
    };
  },

  async getQuestions(
    params: { category_id?: number; category_code?: string },
    signal?: AbortSignal,
  ): Promise<HelpQuestionsData> {
    const response = await http.get<HelpQuestionsData | { list?: HelpQuestionRaw[] }>(
      '/api/Help/questions',
      {
        query: params,
        signal,
      },
    );

    return {
      list: Array.isArray(response?.list) ? response.list.map(normalizeQuestion) : [],
    };
  },
};
