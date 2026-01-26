/**
 * ForgotPassword - 找回密码页面
 * 已迁移: 使用 PasswordForm 内置导航
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React from 'react';
import { PasswordForm } from '@/components/business';

/**
 * ForgotPassword 找回密码页面组件
 */
const ForgotPassword: React.FC = () => {
  return (
    <PasswordForm
      type="forgot"
      title="找回登录密码"
    />
  );
};

export default ForgotPassword;
