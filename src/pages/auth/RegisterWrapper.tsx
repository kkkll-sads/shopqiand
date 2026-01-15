/**
 * Register 页面包装器
 */
import React from 'react';
import Register from '../../../pages/auth/Register';
import { withNavigation } from '../../hoc/withNavigation';

const RegisterWithNav = withNavigation(Register);

const RegisterWrapper: React.FC = () => <RegisterWithNav />;

export default RegisterWrapper;
