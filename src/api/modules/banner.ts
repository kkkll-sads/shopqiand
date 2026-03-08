/**
 * 轮播图 API 模块
 * 接口：GET /api/Banner/getBannerList
 * 需要请求头：ba-token, ba-user-token
 */
import { createApiHeaders } from '../core/headers';
import { http } from '../http';

/** 轮播图列表项（后端返回的原始结构） */
export interface BannerItem {
  id: number | string;
  /** 轮播图图片地址（可能是相对路径或绝对 URL） */
  image: string;
  /** 轮播图标题 */
  title?: string;
  /** 点击跳转链接 */
  url?: string;
  /** 排序权重 */
  sort?: number;
  /** 状态 */
  status?: number | string;
  /** 描述文字 */
  description?: string;
  [key: string]: unknown;
}

/** 列表接口分页响应 */
interface BannerListResponse {
  list: BannerItem[];
  total: number;
  current_page: number;
  last_page: number;
}

/** 查询参数 */
export interface BannerListQuery {
  page?: number;
  limit?: number;
}

export const bannerApi = {
  /**
   * 获取轮播图列表
   * @param query  分页参数 { page, limit }
   * @param signal 取消信号
   */
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
