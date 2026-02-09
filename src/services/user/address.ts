import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';

// 收货地址相关
export interface AddressItem {
  id: number;
  user_id?: number;
  name: string; // 收货人姓名
  phone: string; // 手机号
  province: string; // 省份
  city: string; // 城市
  district?: string; // 区/县
  address: string; // 详细地址
  is_default: number | string; // 1: 默认, 0: 非默认
  region_text?: string; // 前端组合显示的地区文本
  detail?: string;
  [key: string]: any;
}

export interface AddressListData {
  list: AddressItem[];
  [key: string]: any;
}

export async function fetchAddressList(token: string): Promise<ApiResponse<AddressListData>> {
  return authedFetch<AddressListData>(API_ENDPOINTS.address.list, {
    method: 'GET',
    token,
  });
}

export interface SaveAddressParams {
  id?: number | string; // 有 id 为编辑，无 id 为新增
  name: string; // 收货人姓名
  phone: string; // 手机号
  province: string; // 省份
  city: string; // 城市
  district?: string; // 区/县
  address: string; // 详细地址
  is_default: boolean | number; // 是否默认地址: 0=否, 1=是
  token?: string;
}

export async function saveAddress(params: SaveAddressParams): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();

  if (params.id) payload.append('id', String(params.id));
  payload.append('name', params.name);
  payload.append('phone', params.phone);
  payload.append('province', params.province);
  payload.append('city', params.city);
  payload.append('district', params.district || '');
  payload.append('address', params.address);
  payload.append('is_default', params.is_default ? '1' : '0');

  const url = params.id ? API_ENDPOINTS.address.edit : API_ENDPOINTS.address.add;
  return authedFetch(url, {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function deleteAddress(params: { id: number | string; token?: string }): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();
  payload.append('id', String(params.id));

  return authedFetch(API_ENDPOINTS.address.delete, {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function fetchDefaultAddress(token: string): Promise<ApiResponse<AddressItem>> {
  return authedFetch<AddressItem>(API_ENDPOINTS.address.getDefault, {
    method: 'GET',
    token,
  });
}
