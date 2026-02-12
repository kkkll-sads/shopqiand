/**
 * PasswordForm - 密码表单组件
 * 已重构: 拆分为多个子组件和 hooks
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common';
import { PasswordInput } from '../password';
import {
  PasswordFormErrorAlert,
  PasswordFormHeader,
  PasswordFormResetPayNotice,
} from './components';
import { usePasswordForm } from './hooks/usePasswordForm';
import type { PasswordFormProps } from './types';

const PasswordForm: React.FC<PasswordFormProps> = ({
  type,
  title,
  onBack,
  onSuccess,
  onNavigateForgotPassword,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate(-1);
  };

  const handleForgotPasswordNavigation = () => {
    if (onNavigateForgotPassword) {
      onNavigateForgotPassword();
      return;
    }

    navigate('/forgot-password');
  };

  const {
    currentType,
    config,
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
  } = usePasswordForm({
    type,
    onBack: handleBack,
    onSuccess,
    onNavigateForgotPassword: handleForgotPasswordNavigation,
  });

  const onSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <PasswordFormHeader
        title={title}
        currentType={currentType}
        onBack={handleBack}
        onRightAction={handleTopRightAction}
      />

      <main className="pt-2">
        {currentType === 'reset_pay' && <PasswordFormResetPayNotice />}

        <form className="bg-white px-4" onSubmit={onSubmitForm}>
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
                  onClick={() => {
                    void handleSendCode();
                  }}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
                </button>
              </div>
            </div>
          )}

          {config.oldLabel && (
            <PasswordInput
              label={config.oldLabel}
              placeholder={config.oldPlaceholder}
              value={oldPassword}
              onChange={setOldPassword}
              showPassword={showOldPassword}
              onToggleVisibility={toggleShowOldPassword}
              disabled={loading}
            />
          )}

          <PasswordInput
            label={config.newLabel}
            placeholder={config.newPlaceholder}
            value={newPassword}
            onChange={setNewPassword}
            showPassword={showNewPassword}
            onToggleVisibility={toggleShowNewPassword}
            disabled={loading}
          />

          {config.confirmLabel && (
            <PasswordInput
              label={config.confirmLabel}
              placeholder={config.confirmPlaceholder}
              value={confirmPassword}
              onChange={setConfirmPassword}
              showPassword={showConfirmPassword}
              onToggleVisibility={toggleShowConfirmPassword}
              disabled={loading}
            />
          )}

        </form>

        <div className="px-4 mt-6">
          {error && <PasswordFormErrorAlert message={error} />}

          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
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
