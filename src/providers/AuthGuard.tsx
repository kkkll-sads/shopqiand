/**
 * 认证守卫组件
 * 保护需要登录的路由
 */
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRealName?: boolean;
}

// 公开路由列表（不需要登录）
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/privacy-policy',
  '/user-agreement',
  '/about-us',
  '/help-center',
  '/online-service',
];

// 实名认证白名单（登录后不需要实名也能访问）
const realNameWhitelist = ['/', '/real-name-auth', '/online-service', '/help-center'];

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requireRealName = true,
}) => {
  const location = useLocation();
  const { isLoggedIn, isRealNameVerified } = useAuthStore();
  const currentPath = location.pathname;

  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some(
    (route) => currentPath === route || currentPath.startsWith(route + '/')
  );

  // 检查是否在实名白名单中
  const isRealNameWhitelisted = realNameWhitelist.some(
    (route) => currentPath === route || currentPath.startsWith(route + '/')
  );

  // 公开路由不需要检查
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // 需要登录但未登录
  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 需要实名但未实名（且不在白名单中）
  if (requireRealName && isLoggedIn && !isRealNameVerified && !isRealNameWhitelisted) {
    return <Navigate to="/real-name-auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
