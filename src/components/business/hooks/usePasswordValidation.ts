/**
 * usePasswordValidation - 密码验证逻辑 Hook
 */
import { useState, useCallback } from 'react';

type FormType = 'reset_login' | 'reset_pay' | 'reset_pay_sms' | 'forgot';

interface UsePasswordValidationParams {
  type: FormType;
  phone?: string;
  code?: string;
  oldPassword?: string;
  newPassword: string;
  confirmPassword?: string;
}

export function usePasswordValidation() {
  const [error, setError] = useState('');

  const validate = useCallback(({
    type,
    phone,
    code,
    oldPassword,
    newPassword,
    confirmPassword,
  }: UsePasswordValidationParams): boolean => {
    setError('');

    // 找回密码场景
    if (type === 'forgot') {
      if (!phone || !code || !newPassword) {
        setError('请完整填写手机号、验证码和新密码');
        return false;
      }

      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone.trim())) {
        setError('请输入正确的手机号');
        return false;
      }

      const passwordRegex = /^[A-Za-z0-9]{6,32}$/;
      if (!passwordRegex.test(newPassword.trim())) {
        setError('新密码需为6-32位字母或数字，且不含特殊字符');
        return false;
      }

      return true;
    }

    // 支付密码验证
    if (type === 'reset_pay') {
      const sixDigitRegex = /^\d{6}$/;
      if (!sixDigitRegex.test(oldPassword?.trim() || '') || !sixDigitRegex.test(newPassword.trim()) || !sixDigitRegex.test(confirmPassword?.trim() || '')) {
        setError('支付密码需为6位数字');
        return false;
      }
      if (newPassword.trim() !== confirmPassword?.trim()) {
        setError('两次输入的新密码不一致');
        return false;
      }
      return true;
    }

    if (type === 'reset_pay_sms') {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone?.trim() || '')) {
        setError('请输入正确的手机号');
        return false;
      }
      if (!code?.trim()) {
        setError('请输入短信验证码');
        return false;
      }
      const sixDigitRegex = /^\d{6}$/;
      if (!sixDigitRegex.test(newPassword.trim()) || !sixDigitRegex.test(confirmPassword?.trim() || '')) {
        setError('支付密码需为6位数字');
        return false;
      }
      if (newPassword.trim() !== confirmPassword?.trim()) {
        setError('两次输入的新密码不一致');
        return false;
      }
      return true;
    }

    // 重置登录密码
    if (!oldPassword?.trim() || !newPassword.trim() || !confirmPassword?.trim()) {
      setError('请完整填写所有字段');
      return false;
    }

    if (newPassword.trim().length < 6) {
      setError('新密码长度至少需要 6 位');
      return false;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('两次输入的新密码不一致');
      return false;
    }

    return true;
  }, []);

  return {
    error,
    setError,
    validate,
  };
}
