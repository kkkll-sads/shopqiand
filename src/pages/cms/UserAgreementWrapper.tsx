import React from 'react';
import UserAgreement from '../../../pages/cms/UserAgreement';
import { withNavigation } from '../../hoc/withNavigation';

const UserAgreementWithNav = withNavigation(UserAgreement);

const UserAgreementWrapper: React.FC = () => <UserAgreementWithNav />;

export default UserAgreementWrapper;
