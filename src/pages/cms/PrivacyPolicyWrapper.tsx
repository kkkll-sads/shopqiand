import React from 'react';
import PrivacyPolicy from '../../../pages/cms/PrivacyPolicy';
import { withNavigation } from '../../hoc/withNavigation';

const PrivacyPolicyWithNav = withNavigation(PrivacyPolicy);

const PrivacyPolicyWrapper: React.FC = () => <PrivacyPolicyWithNav />;

export default PrivacyPolicyWrapper;
