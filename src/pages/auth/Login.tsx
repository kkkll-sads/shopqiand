/**
 * Login - 登录页面（新路由系统版）
 *
 * ✅ 已迁移：使用 React Router + useNavigate
 * ✅ 已迁移：使用 useAuthStore 管理登录状态
 *
 * @author 树交所前端团队
 * @version 3.0.0（新路由版）
 * @refactored 2026-01-14
 */

import React from 'react';
import LoginFormView from './login/components/LoginFormView';
import { useLoginPage } from './login/hooks/useLoginPage';

/**
 * Login 登录页面组件
 */
const Login: React.FC = () => {
  const {
    phone,
    password,
    verifyCode,
    agreed,
    showPassword,
    loginType,
    countdown,
    rememberMe,
    bottomPadding,
    loading,
    setPhone,
    setPassword,
    setVerifyCode,
    setLoginType,
    toggleShowPassword,
    toggleRememberMe,
    toggleAgreed,
    handleSendCode,
    handleLogin,
    navigateOnlineService,
    navigateForgotPassword,
    navigateUserAgreement,
    navigatePrivacyPolicy,
    navigateRegister,
  } = useLoginPage();

  return (
    <LoginFormView
      phone={phone}
      password={password}
      verifyCode={verifyCode}
      agreed={agreed}
      showPassword={showPassword}
      loginType={loginType}
      countdown={countdown}
      rememberMe={rememberMe}
      bottomPadding={bottomPadding}
      loading={loading}
      onPhoneChange={setPhone}
      onPasswordChange={setPassword}
      onVerifyCodeChange={setVerifyCode}
      onTogglePasswordVisibility={toggleShowPassword}
      onToggleLoginType={setLoginType}
      onSendCode={() => {
        void handleSendCode();
      }}
      onToggleRememberMe={toggleRememberMe}
      onToggleAgreed={toggleAgreed}
      onLogin={() => {
        void handleLogin();
      }}
      onNavigateOnlineService={navigateOnlineService}
      onNavigateForgotPassword={navigateForgotPassword}
      onNavigateUserAgreement={navigateUserAgreement}
      onNavigatePrivacyPolicy={navigatePrivacyPolicy}
      onNavigateRegister={navigateRegister}
    />
  );
};

export default Login;
