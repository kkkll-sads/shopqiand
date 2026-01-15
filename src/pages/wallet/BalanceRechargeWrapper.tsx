import React from 'react';
import BalanceRecharge from '../../../pages/wallet/BalanceRecharge';
import { withNavigation } from '../../hoc/withNavigation';

const BalanceRechargeWithNav = withNavigation(BalanceRecharge);

const BalanceRechargeWrapper: React.FC = () => <BalanceRechargeWithNav />;

export default BalanceRechargeWrapper;
