/**
 * Register 页面包装器（简化版）
 * 
 * ✅ 已简化：Register页面已迁移到新路由系统，不再需要Props
 */
import React from 'react';
import Register from '../../../pages/auth/Register';

const RegisterWrapper: React.FC = () => {
  return <Register />;
};

export default RegisterWrapper;
