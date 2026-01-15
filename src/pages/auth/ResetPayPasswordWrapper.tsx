import React from 'react';
import ResetPayPassword from '../../../pages/auth/ResetPayPassword';
import { withNavigation } from '../../hoc/withNavigation';

const ResetPayPasswordWithNav = withNavigation(ResetPayPassword);

const ResetPayPasswordWrapper: React.FC = () => <ResetPayPasswordWithNav />;

export default ResetPayPasswordWrapper;
