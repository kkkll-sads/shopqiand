import React from 'react';
import RealNameAuth from '../../../pages/user/RealNameAuth';
import { withNavigation } from '../../hoc/withNavigation';

const RealNameAuthWithNav = withNavigation(RealNameAuth);

const RealNameAuthWrapper: React.FC = () => <RealNameAuthWithNav />;

export default RealNameAuthWrapper;
