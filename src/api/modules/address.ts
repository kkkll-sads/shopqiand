/**
 * @file 收货地址 API
 * @description 收货地址管理，基于 /api/shopAddress
 */

import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export interface AddressOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

/** 接口返回的地址对象（原始格式） */
export interface AddressRaw {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  is_default?: string | boolean;
  create_time?: number;
  update_time?: number;
}

/** 收货地址项（前端使用） */
export interface AddressItem {
  id: number;
  name: string;
  phone: string;
  /** 省市区拼接，如 "广东省 深圳市 南山区" */
  region: string;
  /** 详细地址 */
  detail: string;
  is_default: boolean;
}

/** 地址列表响应 */
interface AddressListData {
  list?: AddressRaw[];
}

/** 添加地址响应 */
interface AddressAddData {
  id?: number | string;
}

function readNumber(v: number | string | undefined): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function readString(v: string | undefined): string {
  return typeof v === 'string' ? v.trim() : '';
}

function readBool(v: string | boolean | undefined): boolean {
  if (typeof v === 'boolean') return v;
  return v === '1' || v === 'true';
}

/** 将省市区拼接为 region */
function buildRegion(p?: string, c?: string, d?: string): string {
  return [p, c, d].filter(Boolean).join(' ').trim();
}

/** 解析接口地址为前端格式 */
export function normalizeAddress(raw: AddressRaw | undefined): AddressItem {
  if (!raw || typeof raw !== 'object') {
    return { id: 0, name: '', phone: '', region: '', detail: '', is_default: false };
  }
  const province = readString(raw.province);
  const city = readString(raw.city);
  const district = readString(raw.district);
  return {
    id: readNumber(raw.id),
    name: readString(raw.name),
    phone: readString(raw.phone),
    region: buildRegion(province, city, district),
    detail: readString(raw.address),
    is_default: readBool(raw.is_default),
  };
}

/** 将 region 拆分为 province, city, district */
function parseRegion(region: string): { province: string; city: string; district: string } {
  const parts = (region || '').trim().split(/\s+/).filter(Boolean);
  return {
    province: parts[0] ?? '',
    city: parts[1] ?? '',
    district: parts[2] ?? '',
  };
}

export const addressApi = {
  /**
   * 获取地址列表
   * GET /api/shopAddress/index
   */
  async list(options: AddressOptions = {}): Promise<AddressItem[]> {
    const data = await http.get<AddressListData>('/api/shopAddress/index', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });
    const list = Array.isArray(data?.list) ? data.list : [];
    return list.map(normalizeAddress);
  },

  /**
   * 获取默认地址
   * GET /api/shopAddress/getDefault
   */
  async getDefault(options: AddressOptions = {}): Promise<AddressItem | null> {
    const data = await http.get<AddressRaw | object>('/api/shopAddress/getDefault', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });
    if (!data || typeof data !== 'object' || !('id' in data)) {
      return null;
    }
    const item = normalizeAddress(data as AddressRaw);
    return item.id > 0 ? item : null;
  },

  /**
   * 添加地址
   * POST /api/shopAddress/add
   * region 可选，格式如 "广东省 深圳市 南山区"，会解析为 province/city/district
   */
  async add(
    payload: {
      name: string;
      phone: string;
      province?: string;
      city?: string;
      district?: string;
      region?: string;
      address: string;
      detail?: string;
      is_default?: boolean;
    },
    options: AddressOptions = {}
  ): Promise<number> {
    const { province, city, district } =
      payload.province != null || payload.region != null
        ? payload.province != null
          ? {
              province: payload.province ?? '',
              city: payload.city ?? '',
              district: payload.district ?? '',
            }
          : parseRegion(payload.region ?? '')
        : { province: '', city: '', district: '' };
    const address = payload.address?.trim() || payload.detail?.trim() || '';
    const data = await http.post<AddressAddData, Record<string, unknown>>(
      '/api/shopAddress/add',
      {
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        province,
        city,
        district,
        address,
        is_default: payload.is_default ? '1' : '0',
      },
      { headers: createApiHeaders(options), signal: options.signal }
    );
    return readNumber(data?.id);
  },

  /**
   * 编辑地址
   * POST /api/shopAddress/edit
   */
  async edit(
    payload: {
      id: number;
      name: string;
      phone: string;
      province?: string;
      city?: string;
      district?: string;
      region?: string;
      address: string;
      detail?: string;
      is_default?: boolean;
    },
    options: AddressOptions = {}
  ): Promise<void> {
    const { province, city, district } =
      payload.province != null || payload.region != null
        ? payload.province != null
          ? {
              province: payload.province ?? '',
              city: payload.city ?? '',
              district: payload.district ?? '',
            }
          : parseRegion(payload.region ?? '')
        : { province: '', city: '', district: '' };
    const address = payload.address?.trim() || payload.detail?.trim() || '';
    await http.post(
      '/api/shopAddress/edit',
      {
        id: payload.id,
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        province,
        city,
        district,
        address,
        is_default: payload.is_default ? '1' : '0',
      },
      { headers: createApiHeaders(options), signal: options.signal }
    );
  },

  /**
   * 删除地址
   * POST /api/shopAddress/delete
   */
  async delete(id: number, options: AddressOptions = {}): Promise<void> {
    await http.post(
      '/api/shopAddress/delete',
      { id },
      { headers: createApiHeaders(options), signal: options.signal }
    );
  },

  /**
   * 设置默认地址
   * POST /api/shopAddress/setDefault
   */
  async setDefault(id: number, options: AddressOptions = {}): Promise<void> {
    await http.post(
      '/api/shopAddress/setDefault',
      { id },
      { headers: createApiHeaders(options), signal: options.signal }
    );
  },
};
