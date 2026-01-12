import { ApiResponse } from './networking';
import { API_ENDPOINTS } from './config';
import { authedFetch } from './client';

/**
 * 版本检查请求参数
 */
export interface CheckUpdateParams {
  /** 平台类型 */
  platform: 'android' | 'ios';
  /** 当前版本号 */
  current_version: string;
}

/**
 * 应用版本信息
 */
export interface AppVersionInfo {
  /** 应用名称 */
  app_name: string;
  /** 版本代码 */
  version_code: string;
  /** 下载地址 */
  download_url: string;
}

/**
 * 版本检查响应数据
 */
export interface CheckUpdateResponse {
  /** 是否需要更新 */
  need_update: boolean;
  /** 更新消息 */
  message: string;
  /** 版本信息（仅在需要更新时返回） */
  data?: AppVersionInfo;
}

/**
 * 检查应用版本更新
 * @param params 版本检查参数
 * @returns 版本检查结果
 */
export async function checkAppUpdate(params: CheckUpdateParams): Promise<ApiResponse<CheckUpdateResponse>> {
  const queryParams = new URLSearchParams({
    platform: params.platform,
    current_version: params.current_version,
  });

  const url = `${API_ENDPOINTS.app.checkUpdate}?${queryParams.toString()}`;

  return await authedFetch<CheckUpdateResponse>(url, {
    method: 'GET',
  });
}
