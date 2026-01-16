/**
 * ResetPayPassword - 修改支付密码页面
 * 已迁移: 使用 PasswordForm 内置导航
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordForm } from '../../../components/business';

/**
 * ResetPayPassword 修改支付密码页面组件
 */
const ResetPayPassword: React.FC = () => {
  const navigate = useNavigate();
  const [formType, setFormType] = useState<'reset_pay' | 'reset_pay_sms'>('reset_pay');

  const handleBack = () => {
    if (formType === 'reset_pay_sms') {
      setFormType('reset_pay');
      return;
    }
    navigate(-1);
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
