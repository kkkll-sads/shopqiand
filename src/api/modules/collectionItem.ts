/**
 * 藏品商品列表 API 模块
 * 接口：GET /api/collectionItem/bySession
 * 根据专场获取商品列表（含寄售商品）
 */
import { createApiHeaders } from '../core/headers';
import { http } from '../http';

/* ==================== 类型定义 ==================== */

/** 商品列表项（按资产包+分区聚合） */
export interface CollectionItem {
  /** 资产包 ID */
  package_id: number;
  /** 资产包名称 */
  package_name: string;
  /** 商品图片（相对路径，需 resolveUploadUrl 解析） */
  image: string;
  /** 可用总量 */
  total_available: number;
  /** 最低分区金额 */
  min_zone: string;
  /** 最高分区金额 */
  max_zone: string;
  /** 价格区间描述，如 "400-8000" */
  zone_range: string;
  /** 是否支持混合支付 */
  is_mixed_pay_available?: boolean;
  /** 其他扩展字段 */
  [key: string]: unknown;
}

/** 列表分页响应 */
export interface CollectionItemListResponse {
  list: CollectionItem[];
  total: number;
  page: number;
  limit: number;
  /** 场次基础信息 */
  session?: {
    id: number;
    title: string;
    is_mixed_pay_available?: boolean;
    [key: string]: unknown;
  };
}

/** 查询参数 */
export interface CollectionItemQuery {
  /** 专场 ID */
  session_id: number;
  /** 页码，默认 1 */
  page?: number;
  /** 每页数量，默认 10，最大 50 */
  limit?: number;
}

/** 价格分区 */
export interface CollectionZone {
  /** 分区 ID */
  zone_id: number;
  /** 分区名称（如 "100"） */
  zone_name: string;
  /** 最低价格 */
  min_price: number;
  /** 最高价格 */
  max_price: number;
  /** 库存 */
  stock: number;
}

/** 用户余额信息 */
export interface CollectionUserInfo {
  /** 可用余额 */
  balance_available: number;
  /** 待激活金 */
  pending_activation_gold: number;
  /** 绿色算力 */
  green_power: number;
}

/** 算力配置 */
export interface CollectionConfig {
  /** 基础算力消耗 */
  base_hashrate_cost: number;
  /** 最大额外加注算力 */
  max_extra_hashrate: number;
}

/** 明细响应（新结构） */
export interface CollectionDetailResponse {
  /** 场次 ID */
  session_id: number;
  /** 资产包 ID */
  package_id: number;
  /** 资产包名称 */
  package_name: string;
  /** 资产包图片 */
  image: string;
  /** 可用总量 */
  total_available: number;
  /** 是否支持混合支付 */
  is_mixed_pay_available?: boolean;
  /** 价格分区列表 */
  zones: CollectionZone[];
  /** 场次信息 */
  session?: Record<string, unknown>;
  /** 用户余额信息 */
  user: CollectionUserInfo;
  /** 算力配置 */
  config: CollectionConfig;
}

/** 明细查询参数 */
export interface CollectionDetailQuery {
  /** 专场 ID */
  session_id: number;
  /** 资产包 ID */
  package_id: number;
  /** 价格区间 ID（可选） */
  zone_id?: number;
  /** 页码，默认 1 */
  page?: number;
  /** 每页数量，默认 20，最大 50 */
  limit?: number;
}

/* ==================== API ==================== */

export const collectionItemApi = {
  /**
   * 根据专场获取商品列表（含寄售商品）
   */
  async getBySession(query: CollectionItemQuery, signal?: AbortSignal) {
    const response = await http.get<CollectionItemListResponse>(
      '/api/collectionItem/bySession',
      {
        headers: createApiHeaders(),
        query: {
          session_id: query.session_id,
          page: query.page ?? 1,
          limit: query.limit ?? 10,
        },
        signal,
      },
    );

    return response;
  },

  /**
   * 获取专场商品明细（分区列表 + 用户余额 + 配置）
   * GET /api/collectionItem/bySessionDetail
   */
  async getBySessionDetail(query: CollectionDetailQuery, signal?: AbortSignal) {
    const response = await http.get<CollectionDetailResponse>(
      '/api/collectionItem/bySessionDetail',
      {
        headers: createApiHeaders(),
        query: {
          session_id: query.session_id,
          package_id: query.package_id,
          ...(query.zone_id != null && { zone_id: query.zone_id }),
        },
        signal,
      },
    );

    return response;
  },
};
