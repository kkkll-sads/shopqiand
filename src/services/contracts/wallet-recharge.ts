export interface CompanyAccountItem {
  id: number;
  type: string;
  type_text?: string;
  account_name: string;
  account_number: string;
  bank_name?: string;
  bank_branch?: string;
  icon: string;
  remark: string;
  status: number;
  status_text?: string;
  [key: string]: unknown;
}

export interface SubmitRechargeOrderParams {
  company_account_id: number;
  amount: number | string;
  voucher?: File;
  payment_screenshot?: File;
  payment_screenshot_id?: number | string;
  payment_screenshot_url?: string;
  payment_type?: string;
  payment_method?: 'online' | 'offline';
  remark?: string;
  card_last_four?: string;
  token?: string;
}

export interface SubmitRechargeOrderResult {
  order_id?: number;
  order_no?: string;
  pay_url?: string;
}

export interface UpdateRechargeOrderRemarkParams {
  order_id?: string | number;
  order_no?: string;
  user_remark: string;
  token?: string;
}

export interface SubmitWithdrawParams {
  payment_id?: string | number;
  payment_account_id?: string | number;
  amount: number | string;
  pay_password?: string;
  token?: string;
  remark?: string;
}

export interface RechargeOrderItem {
  id: number;
  order_no: string;
  money: number;
  amount?: number | string;
  status: number;
  status_text: string;
  createtime: number;
  create_time?: number;
  create_time_text?: string;
  payment_type?: string;
  payment_type_text?: string;
  [key: string]: unknown;
}

export interface RechargeOrderListData {
  data: RechargeOrderItem[];
  total: number;
  last_page: number;
  current_page: number;
}

export interface WithdrawRecordItem {
  id: number;
  amount: number | string;
  fee: number | string;
  actual_amount: number | string;
  account_type: string;
  account_type_text: string;
  account_name: string;
  account_number: string;
  bank_name?: string;
  status: number;
  status_text: string;
  audit_reason?: string;
  pay_reason?: string;
  remark?: string;
  create_time: number;
  create_time_text: string;
  audit_time?: number;
  audit_time_text?: string;
  pay_time?: number;
  pay_time_text?: string;
  order_no?: string;
  money?: number;
  createtime?: number;
}

export interface WithdrawListResponse {
  data: WithdrawRecordItem[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface RechargeOrderDetail {
  id: number;
  order_no: string;
  amount: number;
  payment_type: string;
  payment_type_text?: string;
  status: number;
  status_text: string;
  payment_screenshot?: string;
  audit_remark?: string;
  create_time: number;
  create_time_text: string;
  audit_time?: number;
  audit_time_text?: string;
  [key: string]: unknown;
}
