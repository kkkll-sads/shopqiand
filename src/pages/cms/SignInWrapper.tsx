import React from 'react';
import SignIn from '../../../pages/cms/SignIn';
import { withNavigation } from '../../hoc/withNavigation';

const SignInWithNav = withNavigation(SignIn);

const SignInWrapper: React.FC = () => <SignInWithNav />;

export default SignInWrapper;
