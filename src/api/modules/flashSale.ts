/**
 * 秒杀活动 API 模块
 * 接口：
 *   GET /api/flashSale/current  - 当前秒杀活动
 *   GET /api/flashSale/products - 秒杀商品列表
 */
import { createApiHeaders } from '../core/headers';
import { http } from '../http';

/* ==================== 类型定义 ==================== */

/** 秒杀活动信息 */
export interface FlashSaleActivity {
  /** 活动 ID */
  id: number;
  /** 活动名称 */
  name: string;
  /** 开始时间戳 */
  start_time: number;
  /** 结束时间戳 */
  end_time: number;
}

/** 当前活动响应 */
export interface FlashSaleCurrentResponse {
  /** 当前有效活动，无则为 null */
  activity: FlashSaleActivity | null;
}

/** 秒杀商品项 */
export interface FlashSaleProduct {
  /** 秒杀商品 ID */
  flash_sale_product_id: number;
  /** 商城商品 ID */
  product_id: number;
  /** 商品名称 */
  product_name: string;
  /** 缩略图 URL */
  thumbnail: string;
  /** 秒杀价 */
  flash_price: number;
  /** 原价 */
  original_price: number;
  /** 秒杀库存 */
  stock: number;
  /** 每人限购 */
  limit_per_user: number;
  /** 活动是否在有效期内 */
  activity_valid: boolean;
}

/** 商品列表响应 */
export interface FlashSaleProductsResponse {
  list: FlashSaleProduct[];
  /** 活动信息，无则 null */
  activity: FlashSaleActivity | null;
  total: number;
  page: number;
  limit: number;
}

/** 商品列表查询参数 */
export interface FlashSaleProductsQuery {
  /** 活动 ID（不传则用当前有效活动） */
  activity_id?: number;
  /** 页码，默认 1 */
  page?: number;
  /** 每页数量，默认 10 */
  limit?: number;
}

/* ==================== API ==================== */

export const flashSaleApi = {
  /**
   * 获取当前秒杀活动
   * GET /api/flashSale/current
   */
  async getCurrent(signal?: AbortSignal) {
    const response = await http.get<FlashSaleCurrentResponse>(
      '/api/flashSale/current',
      {
        headers: createApiHeaders(),
        signal,
      },
    );
    return response;
  },

  /**
   * 获取秒杀商品列表
   * GET /api/flashSale/products
   */
  async getProducts(query: FlashSaleProductsQuery = {}, signal?: AbortSignal) {
    const response = await http.get<FlashSaleProductsResponse>(
      '/api/flashSale/products',
      {
        headers: createApiHeaders(),
        query: {
          ...(query.activity_id != null && { activity_id: query.activity_id }),
          page: query.page ?? 1,
          limit: query.limit ?? 10,
        },
        signal,
      },
    );
    return response;
  },
};
