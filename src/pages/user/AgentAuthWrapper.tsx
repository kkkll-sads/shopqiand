import React from 'react';
import AgentAuth from '../../../pages/user/AgentAuth';
import { withNavigation } from '../../hoc/withNavigation';

const AgentAuthWithNav = withNavigation(AgentAuth);

const AgentAuthWrapper: React.FC = () => <AgentAuthWithNav />;

export default AgentAuthWrapper;
