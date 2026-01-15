import React from 'react';
import CardManagement from '../../../pages/wallet/CardManagement';
import { withNavigation } from '../../hoc/withNavigation';

const CardManagementWithNav = withNavigation(CardManagement);

const CardManagementWrapper: React.FC = () => <CardManagementWithNav />;

export default CardManagementWrapper;
