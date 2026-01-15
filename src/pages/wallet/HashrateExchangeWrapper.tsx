import React from 'react';
import HashrateExchange from '../../../pages/wallet/HashrateExchange';
import { withNavigation } from '../../hoc/withNavigation';

const HashrateExchangeWithNav = withNavigation(HashrateExchange);

const HashrateExchangeWrapper: React.FC = () => <HashrateExchangeWithNav />;

export default HashrateExchangeWrapper;
