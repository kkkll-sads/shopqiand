import React from 'react';
import OnlineService from '../../../pages/cms/OnlineService';
import { withNavigation } from '../../hoc/withNavigation';

const OnlineServiceWithNav = withNavigation(OnlineService);

const OnlineServiceWrapper: React.FC = () => <OnlineServiceWithNav />;

export default OnlineServiceWrapper;
