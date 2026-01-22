import React from 'react';

export interface Product {
  id: string;
  title: string;
  artist: string;
  price: number;
  image: string;
  category: string;
  /** 商品类型：'shop' 为消费金商城商品，'collection' 为藏品商城商品 */
  productType?: 'shop' | 'collection';
  /** 寄售商品对应的 consignment_id，用于购买接口 */
  consignmentId?: number | string;
  /** 申购记录对应的 matching_pool_id，用于取消确权 */
  reservationId?: number | string;
  /** 申购记录状态 */
  reservationStatus?: string;
  /** 场次ID (用于盲盒预约) */
  sessionId?: number | string;
  /** 价格分区ID (用于盲盒预约) */
  zoneId?: number | string;
  /** 资产包ID (用于盲盒预约) */
  packageId?: number | string;
  /** 消费金价格（整数） */
  score_price?: number;
  /** 绿色能量金额 */
  green_power_amount?: number;
  /** 余额可用金额 */
  balance_available_amount?: number;
  /** 销量 */
  sales?: number;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  title?: string;
  bio?: string;
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  isUnread: boolean;
  type: 'announcement' | 'dynamic';
  content?: string;
}

export interface OrderCategory {
  title: string;
  items: {
    label: string;
    icon: React.ReactNode;
  }[];
}

export interface Order {
  id: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  total: number;
  status: string;
  date: string;
  type: 'product' | 'transaction' | 'delivery' | 'points'; // To filter by section
  subStatusIndex: number; // To filter by tab index within the section
}

export interface Banner {
  id: string;
  image: string;
  tag?: string;
  title?: string;
}

export type Tab = 'home' | 'market' | 'rights' | 'live' | 'profile';

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  email: string;
  mobile: string;
  avatar: string;
  gender: number;
  birthday: string | null;
  money: string;
  balance_available: string;
  service_fee_balance: string;
  withdrawable_money: string;
  score: number;

  /** 绿色算力 */
  green_power: string | number;
  /** 待激活金 (独立核算，不计入总资产) */
  pending_activation_gold?: number | string;

  /** @deprecated 已废弃，合并至 withdrawable_money */
  static_income?: string;
  /** @deprecated 已废弃，与 service_fee_balance 重复 */
  dynamic_income?: string;

  usdt: string;
  last_login_time: number;
  last_login_ip: string;
  join_time: number;
  motto: string;
  draw_count?: number;
  user_type: number;
  token: string;
  refresh_token: string;
  invite_code: string;
  /** 代理商审核状态(-1=未申请,0=待审核,1=已通过,2=已拒绝) */
  agent_review_status: number;

  /** 待激活确权金 (可能与 pending_activation_gold 是同一个，保留兼容) */
  confirm_rights_gold?: number | string;
  /** 旧资产冻结余额 (对应 PHP legacy_frozen) */
  legacy_frozen?: number | string;

  /** 实名认证姓名 */
  real_name?: string;
  /** 实名认证状态 */
  real_name_status?: number;
  /** 寄售券数量 */
  consignment_coupon?: number;
}

export interface ProfileResponse {
  userInfo: UserInfo;
  accountVerificationType: any[];
  liveUrl?: string; // 直播间URL（HLS流地址）
}

export interface LoginSuccessPayload {
  token?: string;
  userInfo?: UserInfo | null;
}

export interface PromotionCardUserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  mobile: string;
}

export interface PromotionCardData {
  user_info: PromotionCardUserInfo;
  invite_code: string;
  invite_link: string;
  qrcode_url: string;
  team_count: number;
  total_performance: number;
}

export interface TeamMember {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  mobile: string;
  join_time?: number;
  join_date?: string;
  register_time?: string;
  level?: number;
  level_text?: string;
}

export interface TeamMembersListData {
  total: number;
  page: number;
  page_size: number;
  list: TeamMember[];
}