import type { FormType, PasswordFormConfig } from './types';

const DEFAULT_FORM_CONFIG: PasswordFormConfig = {
  oldLabel: '旧密码',
  oldPlaceholder: '请输入旧密码',
  newLabel: '新密码',
  newPlaceholder: '请输入新密码',
  confirmLabel: '确认新密码',
  confirmPlaceholder: '请再次输入新密码',
  submitText: '确认',
  minLength: 6,
  showPhone: false,
  showCode: false,
};

const FORM_CONFIGS: Record<FormType, PasswordFormConfig> = {
  reset_login: {
    oldLabel: '旧登录密码',
    oldPlaceholder: '请输入当前使用的登录密码',
    newLabel: '新登录密码',
    newPlaceholder: '请设置新的登录密码',
    confirmLabel: '确认新密码',
    confirmPlaceholder: '请再次输入新密码',
    submitText: '提交修改',
    minLength: 6,
    showPhone: false,
    showCode: false,
  },
  reset_pay: {
    oldLabel: '旧支付密码',
    oldPlaceholder: '请输入当前支付密码（6位数字）',
    newLabel: '新支付密码',
    newPlaceholder: '请设置新支付密码（6位数字）',
    confirmLabel: '确认新密码',
    confirmPlaceholder: '请再次输入新支付密码',
    submitText: '确认修改',
    minLength: 6,
    showPhone: false,
    showCode: false,
  },
  reset_pay_sms: {
    oldLabel: '',
    oldPlaceholder: '',
    newLabel: '新支付密码',
    newPlaceholder: '请设置新支付密码（6位数字）',
    confirmLabel: '确认新密码',
    confirmPlaceholder: '请再次输入新支付密码',
    submitText: '确认重置',
    minLength: 6,
    showPhone: true,
    showCode: true,
  },
  forgot: {
    oldLabel: '',
    oldPlaceholder: '',
    newLabel: '新登录密码',
    newPlaceholder: '请设置新的登录密码，6-32 位',
    confirmLabel: '',
    confirmPlaceholder: '',
    submitText: '重置密码',
    minLength: 6,
    showPhone: true,
    showCode: true,
  },
};

export function getFormConfig(type: FormType): PasswordFormConfig {
  return FORM_CONFIGS[type] || DEFAULT_FORM_CONFIG;
}
