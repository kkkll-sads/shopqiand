/**
 * Login 页面包装器
 */
import React from 'react';
import Login from '../../../pages/auth/Login';
import { withNavigation } from '../../hoc/withNavigation';

const LoginWithNav = withNavigation(Login);

const LoginWrapper: React.FC = () => <LoginWithNav />;

export default LoginWrapper;
