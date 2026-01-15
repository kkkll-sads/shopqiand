import React from 'react';
import LivePage from '../../../pages/live/LivePage';
import { withNavigation } from '../../hoc/withNavigation';

const LivePageWithNav = withNavigation(LivePage);

const LivePageWrapper: React.FC = () => <LivePageWithNav />;

export default LivePageWrapper;
