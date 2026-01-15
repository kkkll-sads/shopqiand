import React from 'react';
import ExtensionWithdraw from '../../../pages/wallet/ExtensionWithdraw';
import { withNavigation } from '../../hoc/withNavigation';

const ExtensionWithdrawWithNav = withNavigation(ExtensionWithdraw);

const ExtensionWithdrawWrapper: React.FC = () => <ExtensionWithdrawWithNav />;

export default ExtensionWithdrawWrapper;
