import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';
import type { ProfileResponse } from '@/types';
import { debugLog, errorLog } from '@/utils/logger';

/**
 * 获取个人中心信息
 * @param token 用户 Token
 */
export async function fetchProfile(token: string): Promise<ApiResponse<ProfileResponse>> {
  try {
    const data = await authedFetch<ProfileResponse>(API_ENDPOINTS.account.profile, {
      method: 'GET',
      token,
    });
    debugLog('api.user.profile.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.user.profile', '获取个人中心信息失败', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const corsError = new Error(
        '网络请求失败，可能是跨域问题或服务器不可达。请检查：\n1. API 服务器是否正常运行\n2. 是否配置了 CORS 允许跨域\n3. 网络连接是否正常'
      );
      (corsError as any).isCorsError = true;
      throw corsError;
    }
    throw error;
  }
}

export interface UpdateAvatarParams {
  avatar?: string;
  avatar_url?: string;
  token?: string;
}

export async function updateAvatar(params: UpdateAvatarParams): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();

  if (!token) {
    throw new Error('未找到用户登录信息，请先登录后再尝试修改头像');
  }

  const payload = {
    avatar: params.avatar || '',
    avatar_url: params.avatar_url || '',
  };

  try {
    const data = await authedFetch(API_ENDPOINTS.user.updateAvatar, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    });
    debugLog('api.user.updateAvatar.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.user.updateAvatar', '修改头像失败', error);
    throw error;
  }
}

export interface UpdateNicknameParams {
  nickname: string;
  token?: string;
}

export async function updateNickname(params: UpdateNicknameParams): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();

  if (!token) {
    throw new Error('未找到用户登录信息，请先登录后再尝试修改昵称');
  }

  if (!params.nickname?.trim()) {
    throw new Error('请输入合法的昵称');
  }

  const payload = new FormData();
  payload.append('nickname', params.nickname.trim());

  try {
    const data = await authedFetch(API_ENDPOINTS.user.updateNickname, {
      method: 'POST',
      body: payload,
      token,
    });
    debugLog('api.user.updateNickname.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.user.updateNickname', '修改昵称失败', error);
    throw error;
  }
}

export interface UpdatePasswordParams {
  old_password: string;
  new_password: string;
  token?: string;
}

export async function updatePassword(params: UpdatePasswordParams): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();

  if (!token) {
    throw new Error('未找到用户登录信息，请先登录后再尝试修改密码');
  }

  const oldPassword = params.old_password?.trim();
  const newPassword = params.new_password?.trim();

  if (!oldPassword) {
    throw new Error('请输入旧密码');
  }

  if (!newPassword) {
    throw new Error('请输入新密码');
  }

  if (newPassword.length < 6) {
    throw new Error('新密码长度至少 6 位');
  }

  if (newPassword === oldPassword) {
    throw new Error('新密码不能与旧密码相同');
  }

  const payload = new FormData();
  payload.append('old_password', oldPassword);
  payload.append('new_password', newPassword);

  try {
    const data = await authedFetch(API_ENDPOINTS.user.updatePassword, {
      method: 'POST',
      body: payload,
      token,
    });
    debugLog('api.user.updatePassword.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.user.updatePassword', '修改登录密码失败', error);
    throw error;
  }
}

export interface UpdatePayPasswordParams {
  old_pay_password: string;
  new_pay_password: string;
  token?: string;
}

export interface ResetPayPasswordBySmsParams {
  mobile: string;
  captcha: string;
  new_pay_password: string;
}

export async function updatePayPassword(params: UpdatePayPasswordParams): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();

  if (!token) {
    throw new Error('未找到用户登录信息，请先登录后再尝试修改支付密码');
  }

  const oldPayPassword = params.old_pay_password?.trim();
  const newPayPassword = params.new_pay_password?.trim();

  if (!oldPayPassword) {
    throw new Error('请输入旧支付密码');
  }

  if (!newPayPassword) {
    throw new Error('请输入新支付密码');
  }

  if (newPayPassword.length < 6) {
    throw new Error('新支付密码长度至少 6 位');
  }

  if (newPayPassword === oldPayPassword) {
    throw new Error('新支付密码不能与旧支付密码相同');
  }

  const payload = new FormData();
  payload.append('old_pay_password', oldPayPassword);
  payload.append('new_pay_password', newPayPassword);

  try {
    const data = await authedFetch(API_ENDPOINTS.user.updatePayPassword, {
      method: 'POST',
      body: payload,
      token,
    });
    debugLog('api.user.updatePayPassword.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.user.updatePayPassword', '修改支付密码失败', error);
    throw error;
  }
}

/**
 * 短信验证码重置支付密码
 * @param params.mobile 手机号
 * @param params.captcha 短信验证码
 * @param params.new_pay_password 新的支付密码（6位数字）
 */
export async function resetPayPasswordBySms(params: ResetPayPasswordBySmsParams): Promise<ApiResponse> {
  const payload = new FormData();
  payload.append('mobile', params.mobile);
  payload.append('captcha', params.captcha);
  payload.append('new_pay_password', params.new_pay_password);

  try {
    const data = await authedFetch(API_ENDPOINTS.user.resetPayPasswordBySms, {
      method: 'POST',
      body: payload,
    });
    debugLog('api.user.resetPayPasswordBySms.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.user.resetPayPasswordBySms', '短信重置支付密码失败', error);
    throw error;
  }
}

export interface CancelAccountParams {
  password: string;
  reason?: string;
  token?: string;
}

export async function cancelAccount(params: CancelAccountParams): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();

  if (!token) {
    throw new Error('未找到用户登录信息，请先登录后再尝试注销账户');
  }

  const password = params.password?.trim();
  const reason = params.reason?.trim() ?? '';

  if (!password) {
    throw new Error('请输入登录密码以确认注销');
  }

  const payload = new FormData();
  payload.append('password', password);
  payload.append('reason', reason);

  try {
    const data = await authedFetch(API_ENDPOINTS.account.cancelAccount, {
      method: 'POST',
      body: payload,
      token,
    });
    debugLog('api.user.cancelAccount.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.user.cancelAccount', '提交账户注销申请失败', error);
    throw error;
  }
}
