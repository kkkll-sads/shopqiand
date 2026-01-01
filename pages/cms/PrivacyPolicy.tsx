import React from 'react';
import { StaticContentPage } from '../../components/business';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <StaticContentPage
      type="privacy_policy"
      defaultTitle="隐私政策"
      onBack={onBack}
    />
  );
};

export default PrivacyPolicy;
