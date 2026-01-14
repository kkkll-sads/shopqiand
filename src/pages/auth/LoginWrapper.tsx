/**
 * Login 页面包装器
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../../../pages/auth/Login';
import { useAuthStore } from '../../stores/authStore';
import type { LoginSuccessPayload } from '../../../types';

const LoginWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = (payload?: LoginSuccessPayload) => {
    if (payload) {
      login(payload);
    }
    navigate('/');
  };

  return (
    <Login
      onLogin={handleLogin}
      onNavigateRegister={() => navigate('/register')}
      onNavigateUserAgreement={() => navigate('/user-agreement')}
      onNavigatePrivacyPolicy={() => navigate('/privacy-policy')}
      onNavigateForgotPassword={() => navigate('/forgot-password')}
      onNavigateOnlineService={() => navigate('/online-service')}
    />
  );
};

export default LoginWrapper;
