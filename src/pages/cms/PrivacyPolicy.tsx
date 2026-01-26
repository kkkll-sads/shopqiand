/**
 * PrivacyPolicy - 隐私政策页面
 * 已迁移: 使用 StaticContentPage 内置导航
 */
import React from 'react';
import { StaticContentPage } from '@/components/business';

const PrivacyPolicy: React.FC = () => {
  return (
    <StaticContentPage
      type="privacy_policy"
      defaultTitle="隐私政策"
    />
  );
};

export default PrivacyPolicy;
