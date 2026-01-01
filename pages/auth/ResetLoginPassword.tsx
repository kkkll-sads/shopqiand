/**
 * ResetLoginPassword - 重置登录密码页面
 * 
 * 使用 PasswordForm 业务组件重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

import React from 'react';
import { PasswordForm } from '../../components/business';

/**
 * ResetLoginPassword 组件属性接口
 */
interface ResetLoginPasswordProps {
  /** 返回回调 */
  onBack: () => void;
  /** 跳转找回密码回调 */
  onNavigateForgotPassword?: () => void;
}

/**
 * ResetLoginPassword 重置登录密码页面组件
 */
const ResetLoginPassword: React.FC<ResetLoginPasswordProps> = ({ onBack, onNavigateForgotPassword }) => {
  return (
    <PasswordForm
      type="reset_login"
      title="重置登录密码"
      onBack={onBack}
      onNavigateForgotPassword={onNavigateForgotPassword}
    />
  );
};

export default ResetLoginPassword;
