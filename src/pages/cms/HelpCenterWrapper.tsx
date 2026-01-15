import React from 'react';
import HelpCenter from '../../../pages/cms/HelpCenter';
import { withNavigation } from '../../hoc/withNavigation';

const HelpCenterWithNav = withNavigation(HelpCenter);

const HelpCenterWrapper: React.FC = () => <HelpCenterWithNav />;

export default HelpCenterWrapper;
