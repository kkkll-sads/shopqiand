/**
 * Login 页面包装器（简化版）
 * 
 * ✅ 已简化：Login页面已迁移到新路由系统，不再需要Props
 */
import React from 'react';
import Login from '../../../pages/auth/Login';

const LoginWrapper: React.FC = () => {
  return <Login />;
};

export default LoginWrapper;
