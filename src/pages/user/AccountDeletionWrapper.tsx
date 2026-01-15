import React from 'react';
import AccountDeletion from '../../../pages/user/AccountDeletion';
import { withNavigation } from '../../hoc/withNavigation';

const AccountDeletionWithNav = withNavigation(AccountDeletion);

const AccountDeletionWrapper: React.FC = () => <AccountDeletionWithNav />;

export default AccountDeletionWrapper;
