import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  resetPayPasswordBySms,
  retrievePassword,
  updatePassword,
  updatePayPassword,
} from '@/services';
import { sendSmsCode } from '@/services/common';
import { useNotification } from '@/context/NotificationContext';
import { useAuthStore } from '@/stores/authStore';
import { extractError, isSuccess } from '@/utils/apiHelpers';
import { usePasswordValidation } from '@/components/business/hooks/usePasswordValidation';
import { getFormConfig } from '../config';
import type { FormType } from '../types';

interface UsePasswordFormOptions {
  type: FormType;
  onBack: () => void;
  onSuccess?: () => void;
  onNavigateForgotPassword: () => void;
}

interface UsePasswordFormResult {
  currentType: FormType;
  config: ReturnType<typeof getFormConfig>;
  presetAccount: string;
  phone: string;
  code: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  countdown: number;
  error: string;
  isAccountDisabled: boolean;
  showOldPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  setPhone: (value: string) => void;
  setCode: (value: string) => void;
  setOldPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  toggleShowOldPassword: () => void;
  toggleShowNewPassword: () => void;
  toggleShowConfirmPassword: () => void;
  handleTopRightAction: () => void;
  handleSendCode: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}

export function usePasswordForm({
  type,
  onBack,
  onSuccess,
  onNavigateForgotPassword,
}: UsePasswordFormOptions): UsePasswordFormResult {
  const { showToast } = useNotification();
  const logout = useAuthStore((state) => state.logout);
  const storedUser = useAuthStore((state) => state.user);
  const presetAccount = storedUser?.mobile || '';

  const [currentType, setCurrentType] = useState<FormType>(type);
  const [phone, setPhone] = useState(presetAccount);
  const [code, setCode] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { error, setError, validate } = usePasswordValidation();
  const config = useMemo(() => getFormConfig(currentType), [currentType]);
  const isAccountDisabled = loading || !!presetAccount;

  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCountdown();
    };
  }, [clearCountdown]);

  const toggleShowOldPassword = useCallback(() => {
    setShowOldPassword((prev) => !prev);
  }, []);

  const toggleShowNewPassword = useCallback(() => {
    setShowNewPassword((prev) => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  const resetPasswordFields = useCallback(() => {
    setCode('');
    setPhone(presetAccount);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }, [presetAccount, setError]);

  const handleTopRightAction = useCallback(() => {
    if (currentType === 'reset_pay') {
      setCurrentType('reset_pay_sms');
      resetPasswordFields();
      return;
    }

    onNavigateForgotPassword();
  }, [currentType, onNavigateForgotPassword, resetPasswordFields]);

  const handleSendCode = useCallback(async () => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      showToast('warning', '手机号错误', '请输入正确的手机号');
      return;
    }

    try {
      await sendSmsCode({
        mobile: phone.trim(),
        event: currentType === 'reset_pay_sms' ? 'reset_pay_password' : 'user_retrieve_pwd',
      });

      showToast('success', '验证码已发送');
      setCountdown(60);
      clearCountdown();

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearCountdown();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      const message = extractError(err, '发送验证码失败');
      showToast('error', '发送失败', message);
    }
  }, [clearCountdown, currentType, phone, showToast]);

  const handleSubmit = useCallback(async () => {
    if (
      !validate({
        type: currentType,
        phone,
        code,
        oldPassword,
        newPassword,
        confirmPassword,
      })
    ) {
      return;
    }

    setLoading(true);

    try {
      if (currentType === 'forgot') {
        await retrievePassword({
          type: 'mobile',
          account: phone.trim(),
          captcha: code.trim(),
          password: newPassword.trim(),
        });

        showToast('success', '重置成功', '请使用新密码重新登录');
        onSuccess?.();
        onBack();
        return;
      }

      if (currentType === 'reset_login') {
        const response = await updatePassword({
          old_password: oldPassword.trim(),
          new_password: newPassword.trim(),
        });

        if (isSuccess(response)) {
          logout();
          showToast('success', '重置成功', '登录密码重置成功，请使用新密码重新登录');
          onSuccess?.();
          onBack();
        } else {
          const errorMessage = extractError(response, '修改密码失败');
          setError(errorMessage);
          showToast('error', '修改失败', errorMessage);
        }
        return;
      }

      if (currentType === 'reset_pay') {
        const response = await updatePayPassword({
          old_pay_password: oldPassword.trim(),
          new_pay_password: newPassword.trim(),
        });

        if (isSuccess(response)) {
          showToast('success', '修改成功', '支付密码修改成功');
          onSuccess?.();
          onBack();
        } else {
          const errorMessage = extractError(response, '修改支付密码失败');
          setError(errorMessage);
          showToast('error', '修改失败', errorMessage);
        }
        return;
      }

      const response = await resetPayPasswordBySms({
        mobile: phone.trim(),
        captcha: code.trim(),
        new_pay_password: newPassword.trim(),
      });

      if (isSuccess(response)) {
        showToast('success', '重置成功', '支付密码重置成功');
        onSuccess?.();
        onBack();
      } else {
        const errorMessage = extractError(response, '重置支付密码失败');
        setError(errorMessage);
        showToast('error', '重置失败', errorMessage);
      }
    } catch (err: any) {
      const message = err?.msg || err?.message || err?.data?.msg || '操作失败，请稍后重试';
      setError(message);
      showToast('error', '操作失败', message);
    } finally {
      setLoading(false);
    }
  }, [
    code,
    confirmPassword,
    currentType,
    logout,
    newPassword,
    oldPassword,
    onBack,
    onSuccess,
    phone,
    setError,
    showToast,
    validate,
  ]);

  return {
    currentType,
    config,
    presetAccount,
    phone,
    code,
    oldPassword,
    newPassword,
    confirmPassword,
    loading,
    countdown,
    error,
    isAccountDisabled,
    showOldPassword,
    showNewPassword,
    showConfirmPassword,
    setPhone,
    setCode,
    setOldPassword,
    setNewPassword,
    setConfirmPassword,
    toggleShowOldPassword,
    toggleShowNewPassword,
    toggleShowConfirmPassword,
    handleTopRightAction,
    handleSendCode,
    handleSubmit,
  };
}
