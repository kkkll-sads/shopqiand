export interface RegisterParams {
  mobile: string;
  password: string;
  pay_password: string;
  invite_code: string;
  captcha: string;
}

export interface LoginParams {
  mobile: string;
  password?: string;
  captcha?: string;
  keep?: boolean | number;
}

export interface RetrievePasswordParams {
  /** 账户类型：mobile/email，默认 mobile */
  type?: 'mobile' | 'email' | string;
  /** 账户：手机号或邮箱 */
  account: string;
  /** 短信/邮箱验证码 */
  captcha: string;
  /** 新密码（6-32位，不能包含特殊字符） */
  password: string;
}
