import React from 'react';
import ResetLoginPassword from '../../../pages/auth/ResetLoginPassword';
import { withNavigation } from '../../hoc/withNavigation';

const ResetLoginPasswordWithNav = withNavigation(ResetLoginPassword);

const ResetLoginPasswordWrapper: React.FC = () => <ResetLoginPasswordWithNav />;

export default ResetLoginPasswordWrapper;
