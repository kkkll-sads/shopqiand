import React from 'react';
import ClaimHistory from '../../../pages/wallet/ClaimHistory';
import { withNavigation } from '../../hoc/withNavigation';

const ClaimHistoryWithNav = withNavigation(ClaimHistory);

const ClaimHistoryWrapper: React.FC = () => <ClaimHistoryWithNav />;

export default ClaimHistoryWrapper;
