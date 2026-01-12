/**
 * ResetPayPassword - 修改支付密码页面
 * 
 * 使用 PasswordForm 业务组件重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { PasswordForm } from '../../components/business';

/**
 * ResetPayPassword 组件属性接口
 */
interface ResetPayPasswordProps {
  /** 返回回调 */
  onBack: () => void;
  /** 跳转找回密码回调 */
  onNavigateForgotPassword?: () => void;
}

/**
 * ResetPayPassword 修改支付密码页面组件
 */
const ResetPayPassword: React.FC<ResetPayPasswordProps> = ({ onBack, onNavigateForgotPassword }) => {
  const [formType, setFormType] = useState<'reset_pay' | 'reset_pay_sms'>('reset_pay');

  const handleBack = () => {
    if (formType === 'reset_pay_sms') {
      setFormType('reset_pay');
      return;
    }
    onBack();
  };

  return (
    <PasswordForm
      type={formType}
      title={formType === 'reset_pay' ? '修改支付密码' : '短信重置支付密码'}
      onBack={handleBack}
      onNavigateForgotPassword={() => setFormType('reset_pay_sms')}
    />
  );
};

export default ResetPayPassword;
