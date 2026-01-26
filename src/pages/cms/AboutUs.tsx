/**
 * AboutUs - 关于我们页面
 * 已迁移: 使用 StaticContentPage 内置导航
 */
import React from 'react';
import { StaticContentPage } from '@/components/business';

const AboutUs: React.FC = () => {
  return (
    <StaticContentPage
      type="about_us"
      defaultTitle="中心介绍"
    />
  );
};

export default AboutUs;
