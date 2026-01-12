import React from 'react';
import { StaticContentPage } from '../../components/business';

interface AboutUsProps {
  onBack: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
  return (
    <StaticContentPage
      type="about_us"
      defaultTitle="中心介绍"
      onBack={onBack}
    />
  );
};

export default AboutUs;