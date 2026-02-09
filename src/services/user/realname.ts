import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';

// 实名认证相关
export interface RealNameStatusData {
  real_name_status: number; // 0:未认证, 1:审核中, 2:已通过, 3:已驳回
  real_name?: string;
  id_card?: string;
  audit_reason?: string;
  id_card_front?: string;
  id_card_back?: string;
  audit_time?: string;
}

export async function fetchRealNameStatus(token: string): Promise<ApiResponse<RealNameStatusData>> {
  return authedFetch<RealNameStatusData>(API_ENDPOINTS.user.realNameStatus, {
    method: 'GET',
    token,
  });
}

export interface SubmitRealNameParams {
  real_name?: string;
  id_card?: string;
  id_card_front?: string;
  id_card_back?: string;
  auth_token: string; // H5人脸核身返回的token，必须传递
  token?: string;
}

export async function submitRealName(
  params: SubmitRealNameParams
): Promise<ApiResponse<{ real_name_status?: number }>> {
  const token = params.token ?? getStoredToken();

  // 前端必须传递 auth_token
  if (!params.auth_token) {
    throw new Error('auth_token 参数是必需的，请进行人脸核身验证后重试');
  }

  const payload = new FormData();

  // 使用 auth_token 模式（H5人脸核身）
  payload.append('auth_token', params.auth_token);

  return authedFetch(API_ENDPOINTS.user.submitRealName, {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function submitRealNameNew(token: string): Promise<ApiResponse<{ real_name_status?: number }>> {
  const payload = new FormData();

  // 使用 auth_token 模式（H5人脸核身）
  payload.append('auth_token', token);

  return authedFetch(API_ENDPOINTS.user.submitRealName, {
    method: 'POST',
    body: payload,
    token,
  });
}

export interface LivePersonCheckParams {
  name: string;
  cardNo: string;
  token: string;
  needAvatar?: boolean | string; // 'true'/'false' or boolean
  picType?: number;
  dataId?: string;
  userToken?: string; // Optional user token override
}

export interface LivePersonCheckResult {
  status: number; // 1=pass, 2=fail, 0=pending
  statusDesc?: string;
  faceMatched?: number; // 1=pass, 2=fail, 0=uncertain
  similarityScore?: number;
  reasonTypeDesc?: string;
  [key: string]: any;
}

export async function livePersonCheck(
  params: LivePersonCheckParams
): Promise<ApiResponse<LivePersonCheckResult>> {
  const token = params.userToken ?? getStoredToken();
  const payload = new URLSearchParams();
  payload.append('name', params.name);
  payload.append('cardNo', params.cardNo);
  payload.append('token', params.token);

  if (params.needAvatar !== undefined) {
    payload.append('needAvatar', String(params.needAvatar));
  }
  if (params.picType !== undefined) {
    payload.append('picType', String(params.picType));
  }
  if (params.dataId) {
    payload.append('dataId', params.dataId);
  }

  return authedFetch<LivePersonCheckResult>(API_ENDPOINTS.yidun.livePersonCheck, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
    token,
  });
}

export interface H5AuthTokenParams {
  real_name: string;
  id_card: string;
  redirect_url: string;
  token?: string;
}

export interface H5AuthTokenResult {
  authUrl: string;
  authToken: string;
}

export async function fetchH5AuthToken(params: H5AuthTokenParams): Promise<ApiResponse<H5AuthTokenResult>> {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();
  payload.append('real_name', params.real_name);
  payload.append('id_card', params.id_card);
  payload.append('redirect_url', params.redirect_url);

  return authedFetch<H5AuthTokenResult>(API_ENDPOINTS.user.getH5AuthToken, {
    method: 'POST',
    body: payload,
    token,
  });
}

/**
 * H5人脸核身校验接口
 * 使用 authToken 获取核身结果
 */
export interface H5RecheckParams {
  authToken: string;
  token?: string;
}

export interface H5RecheckResult {
  taskId?: string;
  picType?: number;
  avatar?: string;
  status: number; // 1=通过, 2=不通过, 0=待定
  reasonType?: number;
  isPayed?: number;
  similarityScore?: number;
  faceMatched?: number; // 1=通过, 2=不通过, 0=不确定
  faceAttributeInfo?: any;
  extInfo?: any;
  reasonTypeDesc?: string;
  statusDesc?: string;
}

export async function h5Recheck(params: H5RecheckParams): Promise<ApiResponse<H5RecheckResult>> {
  const token = params.token ?? getStoredToken();
  const payload = new URLSearchParams();
  payload.append('authToken', params.authToken);

  return authedFetch<H5RecheckResult>(API_ENDPOINTS.yidun.h5Recheck, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
    token,
  });
}
