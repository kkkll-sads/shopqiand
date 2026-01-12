/**
 * ForgotPassword - 找回密码页面
 * 
 * 使用 PasswordForm 业务组件重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

import React from 'react';
import { PasswordForm } from '../../components/business';

/**
 * ForgotPassword 组件属性接口
 */
interface ForgotPasswordProps {
  /** 返回回调 */
  onBack: () => void;
}

/**
 * ForgotPassword 找回密码页面组件
 */
const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  return (
    <PasswordForm
      type="forgot"
      title="找回登录密码"
      onBack={onBack}
    />
  );
};

export default ForgotPassword;
