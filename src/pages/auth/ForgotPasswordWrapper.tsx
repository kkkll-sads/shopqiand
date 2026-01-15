/**
 * ForgotPassword 页面包装器
 */
import React from 'react';
import ForgotPassword from '../../../pages/auth/ForgotPassword';
import { withNavigation } from '../../hoc/withNavigation';

const ForgotPasswordWithNav = withNavigation(ForgotPassword);

const ForgotPasswordWrapper: React.FC = () => <ForgotPasswordWithNav />;

export default ForgotPasswordWrapper;
