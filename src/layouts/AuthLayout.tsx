/**
 * 认证布局组件
 * 用于登录、注册等无底部导航的页面
 */
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="bg-gray-100 min-h-screen-dynamic font-sans antialiased text-gray-900 max-w-md mx-auto relative shadow-2xl">
      <div className="min-h-screen-dynamic bg-gray-50">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
