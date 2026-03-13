import { createApiHeaders } from '../core/headers';
import { http } from '../http';

export interface BannerItem {
  id: number | string;
  image: string;
  title?: string;
  url?: string;
  description?: string;
}

interface BannerListResponse {
  list: BannerItem[];
  total: number;
  current_page: number;
  last_page: number;
}

export interface BannerListQuery {
  page?: number;
  limit?: number;
}

export const bannerApi = {
  async getList(query: BannerListQuery = {}, signal?: AbortSignal) {
    const response = await http.get<BannerListResponse>(
      '/api/Banner/getBannerList',
      {
        headers: createApiHeaders(),
        query: {
          page: query.page ?? 1,
          limit: query.limit ?? 10,
        },
        signal,
      },
    );

    return response;
  },
};
