import React from 'react';
import ClaimDetail from '../../../pages/wallet/ClaimDetail';
import { withNavigation } from '../../hoc/withNavigation';

const ClaimDetailWithNav = withNavigation(ClaimDetail);

const ClaimDetailWrapper: React.FC = () => <ClaimDetailWithNav />;

export default ClaimDetailWrapper;
