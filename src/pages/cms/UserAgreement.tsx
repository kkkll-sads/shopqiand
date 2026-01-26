/**
 * UserAgreement - 用户协议页面
 * 已迁移: 使用 StaticContentPage 内置导航
 */
import React from 'react';
import { StaticContentPage } from '@/components/business';

const UserAgreement: React.FC = () => {
  return (
    <StaticContentPage
      type="user_agreement"
      defaultTitle="用户协议"
    />
  );
};

export default UserAgreement;
