import React from 'react';
import CumulativeRights from '../../../pages/wallet/CumulativeRights';
import { withNavigation } from '../../hoc/withNavigation';

const CumulativeRightsWithNav = withNavigation(CumulativeRights);

const CumulativeRightsWrapper: React.FC = () => <CumulativeRightsWithNav />;

export default CumulativeRightsWrapper;
