import React from 'react';
import { StaticContentPage } from '../../components/business';

interface UserAgreementProps {
  onBack: () => void;
}

const UserAgreement: React.FC<UserAgreementProps> = ({ onBack }) => {
  return (
    <StaticContentPage
      type="user_agreement"
      defaultTitle="用户协议"
      onBack={onBack}
    />
  );
};

export default UserAgreement;
