import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';

/**
 * 批量寄售可寄售列表数据接口
 * API: GET /api/collectionConsignment/batchConsignableList
 */
export interface BatchConsignableListData {
  stats: {
    total_collections: number; // 总藏品数量
    available_collections: number; // 可寄售藏品数量
    current_time: string; // 当前时间
    active_sessions: number; // 活跃场次数量
    is_in_trading_time: boolean; // 是否在交易时间内
  };
  items: Array<{
    user_collection_id: number; // 用户藏品ID
  }>;
  available_now_count: number; // 当前可寄售数量
  returned_items_count: number; // 返回的藏品数量
  note: string; // 备注信息
}

/**
 * 获取可批量寄售的藏品列表
 * API: GET /api/collectionConsignment/batchConsignableList
 */
export async function getBatchConsignableList(token?: string): Promise<ApiResponse<BatchConsignableListData>> {
  const authToken = token ?? getStoredToken();
  return authedFetch<BatchConsignableListData>(API_ENDPOINTS.collectionConsignment.batchConsignableList, {
    method: 'GET',
    token: authToken,
  });
}

/**
 * 批量寄售请求参数接口
 */
export interface BatchConsignParams {
  consignments: Array<{
    user_collection_id: number; // 用户藏品ID
  }>;
  token?: string; // 用户登录Token
}

/**
 * 批量寄售结果接口
 */
export interface BatchConsignResult {
  total_count: number; // 总处理数量
  success_count: number; // 成功数量
  failure_count: number; // 失败数量
  results?: Array<{
    index: number; // 数组索引
    user_collection_id: number; // 用户藏品ID
    success: boolean; // 是否成功
    message: string; // 结果消息
    data?: {
      consignment_id: number; // 寄售ID
      price: number; // 寄售价格
      service_fee: number; // 服务费
      waive_type: string; // 免除类型
    };
  }>;
  failure_summary?: Record<string, number>; // 失败汇总（当失败过多时使用）
  note?: string; // 提示信息
}

/**
 * 执行批量寄售
 * API: POST /api/collectionConsignment/batchConsign
 */
export async function batchConsign(params: BatchConsignParams): Promise<ApiResponse<BatchConsignResult>> {
  const token = params.token ?? getStoredToken();

  return authedFetch<BatchConsignResult>(API_ENDPOINTS.collectionConsignment.batchConsign, {
    method: 'POST',
    token,
    body: JSON.stringify({
      consignments: params.consignments,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
