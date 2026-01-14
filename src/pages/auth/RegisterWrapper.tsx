/**
 * Register 页面包装器
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../../../pages/auth/Register';
import { useAuthStore } from '../../stores/authStore';
import type { LoginSuccessPayload } from '../../../types';

const RegisterWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleRegister = (payload?: LoginSuccessPayload) => {
    if (payload) {
      login(payload);
    }
    navigate('/');
  };

  return (
    <Register
      onRegister={handleRegister}
      onBack={() => navigate(-1)}
      onNavigateLogin={() => navigate('/login')}
      onNavigateUserAgreement={() => navigate('/user-agreement')}
      onNavigatePrivacyPolicy={() => navigate('/privacy-policy')}
    />
  );
};

export default RegisterWrapper;
