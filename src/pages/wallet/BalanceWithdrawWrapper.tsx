import React from 'react';
import BalanceWithdraw from '../../../pages/wallet/BalanceWithdraw';
import { withNavigation } from '../../hoc/withNavigation';

const BalanceWithdrawWithNav = withNavigation(BalanceWithdraw);

const BalanceWithdrawWrapper: React.FC = () => <BalanceWithdrawWithNav />;

export default BalanceWithdrawWrapper;
