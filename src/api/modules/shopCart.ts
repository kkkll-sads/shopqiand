import { http } from '../http';

/** 购物车数量接口响应 */
export interface ShopCartCountResponse {
  /** 购物车总件数 */
  count: number;
}

/** 加入购物车请求参数 */
export interface ShopCartAddParams {
  /** 商品 ID */
  product_id: number;
  /** 数量 */
  quantity: number;
  /** SKU ID（多规格时必传） */
  sku_id?: number;
  /** 来源：normal 普通 / flash_sale 秒杀 */
  source: 'normal' | 'flash_sale';
  /** 秒杀商品 ID（秒杀时传） */
  flash_sale_product_id?: number;
}

/** 加入购物车接口响应 */
export interface ShopCartAddResponse {
  id: number;
  quantity: number;
}

export interface ShopCartUpdateParams {
  id: number;
  quantity: number;
}

export interface ShopCartUpdateResponse {
  id: number;
  quantity: number;
}

export interface ShopCartRemoveParams {
  ids: number[];
}

export interface ShopCartRemoveResponse {
  count: number;
}

/** 购物车单项（含商品与秒杀信息） */
export interface ShopCartListItem {
  /** 购物车项 ID */
  id: number;
  /** 商品 ID */
  product_id: number;
  /** 数量 */
  quantity: number;
  /** 来源：normal 普通 / flash_sale 秒杀 */
  source: 'normal' | 'flash_sale';
  /** 秒杀商品 ID，0 表示普通商品 */
  flash_sale_product_id: number;
  /** 商品名称 */
  product_name: string;
  /** 商品缩略图 URL */
  product_thumbnail: string;
  /** 秒杀价（秒杀项有） */
  flash_price?: number;
  /** 原价（秒杀项有） */
  original_price?: number;
  /** 普通商品价格（接口可能返回） */
  price?: number;
  /** 秒杀活动是否有效 */
  activity_valid?: boolean;
  /** 积分价（部分商品仅积分价） */
  score_price?: number;
}

/** 购物车列表接口响应（后端可能返回 data.list 或 data 直接为数组） */
export interface ShopCartListResponse {
  /** 购物车项列表 */
  list: ShopCartListItem[];
}

/** 后端列表项可能带更多字段 */
export interface ShopCartListItemRaw extends ShopCartListItem {
  user_id?: number;
  create_time?: number;
  update_time?: number;
  product_status?: number;
  score_price?: number;
  flash_stock?: number | null;
  activity_name?: string;
}

function normalizeListResponse(
  payload: ShopCartListResponse | ShopCartListItemRaw[],
): ShopCartListResponse {
  if (Array.isArray(payload)) {
    return { list: payload as ShopCartListItem[] };
  }
  return {
    list: payload.list ?? [],
  };
}

export const shopCartApi = {
  /**
   * 获取购物车总件数
   * GET /api/shopCart/count
   * 请求头需携带 batoken（用户 Token）
   */
  count(signal?: AbortSignal) {
    return http.get<ShopCartCountResponse>('/api/shopCart/count', { signal });
  },

  /**
   * 获取购物车列表
   * GET /api/shopCart/list
   * 请求头需携带 ba-token、ba-user-token 或 batoken（用户 Token）
   * 后端可能返回 data: { list: [] } 或 data: []，此处统一为 { list: [] }
   */
  async list(signal?: AbortSignal): Promise<ShopCartListResponse> {
    const payload = await http.get<ShopCartListResponse | ShopCartListItemRaw[]>(
      '/api/shopCart/list',
      { signal },
    );
    return normalizeListResponse(payload);
  },

  /**
   * 加入购物车
   * POST /api/shopCart/add
   * 请求体：product_id, quantity, sku_id?, source, flash_sale_product_id?
   */
  add(
    params: ShopCartAddParams,
    options?: { signal?: AbortSignal },
  ) {
    return http.post<ShopCartAddResponse>('/api/shopCart/add', params, {
      signal: options?.signal,
    });
  },
  update(
    params: ShopCartUpdateParams,
    options?: { signal?: AbortSignal },
  ) {
    return http.post<ShopCartUpdateResponse>('/api/shopCart/update', params, {
      signal: options?.signal,
    });
  },
  remove(
    params: ShopCartRemoveParams,
    options?: { signal?: AbortSignal },
  ) {
    return http.post<ShopCartRemoveResponse>('/api/shopCart/remove', params, {
      signal: options?.signal,
    });
  },
};
