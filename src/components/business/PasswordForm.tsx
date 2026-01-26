/**
 * PasswordForm - 密码表单组件
 * 已重构: 拆分为多个子组件和 hooks
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LoadingSpinner } from '../common';
import {
  updatePassword,
  updatePayPassword,
  retrievePassword,
  resetPayPasswordBySms,
} from '@/services/api';
import { sendSmsCode } from '@/services/common';
import { useNotification } from '@/context/NotificationContext';
import { useAuthStore } from '@/stores/authStore';
import { isSuccess, extractError } from '@/utils/apiHelpers';
import { PasswordInput } from './password';
import { usePasswordValidation } from './hooks/usePasswordValidation';

type FormType = 'reset_login' | 'reset_pay' | 'reset_pay_sms' | 'forgot';

interface PasswordFormProps {
  type: FormType;
  title: string;
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateForgotPassword?: () => void;
}

const getFormConfig = (type: FormType) => {
  switch (type) {
    case 'reset_login':
      return {
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
      };
    case 'reset_pay':
      return {
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
      };
    case 'reset_pay_sms':
      return {
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
      };
    case 'forgot':
      return {
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
      };
    default:
      return {
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
  }
};

const PasswordForm: React.FC<PasswordFormProps> = ({
  type,
  title,
  onBack,
  onSuccess,
  onNavigateForgotPassword,
}) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [currentType, setCurrentType] = useState<FormType>(type);
  const { showToast } = useNotification();
  const { error, setError, validate } = usePasswordValidation();

  const config = getFormConfig(currentType);
  const storedUser = useAuthStore((state) => state.user);
  const presetAccount = storedUser?.mobile || '';

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

  const isAccountDisabled = loading || !!presetAccount;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleNavigateForgotPassword = () => {
    if (onNavigateForgotPassword) {
      onNavigateForgotPassword();
    } else {
      navigate('/forgot-password');
    }
  };

  const handleSendCode = async () => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      showToast('warning', '手机号错误', '请输入正确的手机号');
      return;
    }

    try {
      await sendSmsCode({
        mobile: phone.trim(),
        event: currentType === 'reset_pay_sms' ? 'reset_pay_password' : 'user_retrieve_pwd'
      });
      showToast('success', '验证码已发送');
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const msg = extractError(error, '发送验证码失败');
      showToast('error', '发送失败', msg);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate({
      type: currentType,
      phone,
      code,
      oldPassword,
      newPassword,
      confirmPassword,
    })) {
      return;
    }

    setLoading(true);

    try {
      if (currentType === 'forgot') {
        const accountType = /^1[3-9]\d{9}$/.test(phone.trim()) ? 'mobile' : 'mobile';
        await retrievePassword({
          type: accountType,
          account: phone.trim(),
          captcha: code.trim(),
          password: newPassword.trim()
        });
        showToast('success', '重置成功', '请使用新密码重新登录');
        onSuccess?.();
        handleBack();
      } else if (currentType === 'reset_login') {
        const response = await updatePassword({
          old_password: oldPassword.trim(),
          new_password: newPassword.trim(),
        });

        if (isSuccess(response)) {
          logout();
          showToast('success', '重置成功', '登录密码重置成功，请使用新密码重新登录');
          onSuccess?.();
          handleBack();
        } else {
          const errorMsg = extractError(response, '修改密码失败');
          setError(errorMsg);
          showToast('error', '修改失败', errorMsg);
        }
      } else if (currentType === 'reset_pay') {
        const response = await updatePayPassword({
          old_pay_password: oldPassword.trim(),
          new_pay_password: newPassword.trim(),
        });

        if (isSuccess(response)) {
          showToast('success', '修改成功', '支付密码修改成功');
          onSuccess?.();
          handleBack();
        } else {
          const errorMsg = extractError(response, '修改支付密码失败');
          setError(errorMsg);
          showToast('error', '修改失败', errorMsg);
        }
      } else if (currentType === 'reset_pay_sms') {
        const response = await resetPayPasswordBySms({
          mobile: phone.trim(),
          captcha: code.trim(),
          new_pay_password: newPassword.trim(),
        });

        if (isSuccess(response)) {
          showToast('success', '重置成功', '支付密码重置成功');
          onSuccess?.();
          handleBack();
        } else {
          const errorMsg = extractError(response, '重置支付密码失败');
          setError(errorMsg);
          showToast('error', '重置失败', errorMsg);
        }
      }
    } catch (err: any) {
      const message = err?.msg || err?.message || err?.data?.msg || '操作失败，请稍后重试';
      setError(message);
      showToast('error', '操作失败', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* 顶部导航栏 */}
      <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <div className="relative flex items-center justify-center w-full">
          <button
            className="absolute left-0 p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors"
            onClick={handleBack}
            aria-label="返回"
          >
            <ChevronLeft size={22} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>

          {(currentType === 'reset_login' || currentType === 'reset_pay') && (
            <button
              type="button"
              className="absolute right-0 text-sm text-red-600 font-medium active:opacity-70"
              onClick={() => {
                if (currentType === 'reset_pay') {
                  setCurrentType('reset_pay_sms');
                  setError('');
                  setCode('');
                  setPhone(presetAccount);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                } else {
                  handleNavigateForgotPassword();
                }
              }}
            >
              {currentType === 'reset_pay' ? '短信重置' : '忘记密码？'}
            </button>
          )}
        </div>
      </header>

      {/* 表单内容 */}
      <main className="pt-2">
        {currentType === 'reset_pay' && (
          <div className="mx-4 mb-4 rounded-xl bg-red-50 p-4">
            <div className="flex gap-3">
              <div className="text-red-500 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-red-700 leading-relaxed">
                支持通过短信验证码重置交易密码；若忘记旧支付密码，请点击右上角"短信重置"。
              </p>
            </div>
          </div>
        )}

        <form className="bg-white px-4" onSubmit={handleSubmit}>
          {/* 账号输入 */}
          {config.showPhone && (
            <div className="py-4 border-b border-gray-100">
              <div className="text-sm text-gray-500 mb-1">账号（手机号）</div>
              <input
                type="tel"
                className={`w-full text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 font-medium ${isAccountDisabled ? 'text-gray-500' : ''}`}
                placeholder="请输入注册时使用的手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isAccountDisabled}
                readOnly={isAccountDisabled}
              />
            </div>
          )}

          {/* 验证码输入 */}
          {config.showCode && (
            <div className="py-4 border-b border-gray-100">
              <div className="text-sm text-gray-500 mb-1">验证码</div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 font-medium"
                  placeholder="请输入短信验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className={`text-sm font-medium transition-opacity whitespace-nowrap ${
                    countdown > 0 || loading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-600 active:opacity-70'
                  }`}
                  onClick={handleSendCode}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
                </button>
              </div>
            </div>
          )}

          {/* 旧密码输入 */}
          {config.oldLabel && (
            <PasswordInput
              label={config.oldLabel}
              placeholder={config.oldPlaceholder}
              value={oldPassword}
              onChange={setOldPassword}
              showPassword={showOldPassword}
              onToggleVisibility={() => setShowOldPassword(!showOldPassword)}
              disabled={loading}
            />
          )}

          {/* 新密码输入 */}
          <PasswordInput
            label={config.newLabel}
            placeholder={config.newPlaceholder}
            value={newPassword}
            onChange={setNewPassword}
            showPassword={showNewPassword}
            onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
            disabled={loading}
          />

          {/* 确认新密码输入 */}
          {config.confirmLabel && (
            <PasswordInput
              label={config.confirmLabel}
              placeholder={config.confirmPlaceholder}
              value={confirmPassword}
              onChange={setConfirmPassword}
              showPassword={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            />
          )}
        </form>

        <div className="px-4 mt-6">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 flex items-start gap-2">
              <div className="text-red-500 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full rounded-full bg-gradient-to-r from-red-600 to-red-700 py-3.5 text-base font-bold text-white shadow-lg shadow-red-500/20 active:scale-[0.98] active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" color="white" />
                <span>处理中...</span>
              </span>
            ) : (
              config.submitText
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default PasswordForm;
