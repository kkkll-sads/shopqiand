/**
 * 藏品专场列表 API 模块
 * 接口：GET /api/collectionSession/index
 * 获取所有专场列表
 */
import { createApiHeaders } from '../core/headers';
import { http } from '../http';

/* ==================== 类型定义 ==================== */

/** 专场列表项 */
export interface CollectionSession {
  /** 专场 ID */
  id: number;
  /** 专场标题 */
  title: string;
  /** 专场图片完整 URL */
  image: string;
  /** 开始时间 (HH:mm) */
  start_time: string;
  /** 结束时间 (HH:mm) */
  end_time: string;
  /** 年化收益率 */
  roi: string;
  /** 额度 */
  quota: string;
  /** 资产池代码 */
  code: string;
  /** 副标题 */
  sub_name: string;
  /** 是否支持混合支付 */
  is_mixed_pay_available?: boolean;
}

/** 列表响应 */
export interface CollectionSessionListResponse {
  list: CollectionSession[];
}

/* ==================== API ==================== */

export const collectionSessionApi = {
  /**
   * 获取藏品专场列表
   */
  async getList(signal?: AbortSignal) {
    const response = await http.get<CollectionSessionListResponse>(
      '/api/collectionSession/index',
      {
        headers: createApiHeaders(),
        signal,
      },
    );

    return response;
  },
};
