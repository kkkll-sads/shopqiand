import { createApiHeaders } from '../core/headers';
import { http } from '../http';

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

export const helpApi = {
  /**
   * 获取问题分类列表
   * GET /api/Help/categories
   */
  async getCategories(signal?: AbortSignal): Promise<HelpCategoriesData> {
    return http.get<HelpCategoriesData>('/api/Help/categories', {
      headers: createApiHeaders(),
      signal,
    });
  },

  /**
   * 获取某分类下的问题列表
   * GET /api/Help/questions
   */
  async getQuestions(
    params: { category_id?: number; category_code?: string },
    signal?: AbortSignal,
  ): Promise<HelpQuestionsData> {
    return http.get<HelpQuestionsData>('/api/Help/questions', {
      headers: createApiHeaders(),
      query: params,
      signal,
    });
  },
};
