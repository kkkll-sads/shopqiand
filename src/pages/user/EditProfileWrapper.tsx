import React from 'react';
import EditProfile from '../../../pages/user/EditProfile';
import { withNavigation } from '../../hoc/withNavigation';

const EditProfileWithNav = withNavigation(EditProfile);

const EditProfileWrapper: React.FC = () => <EditProfileWithNav />;

export default EditProfileWrapper;
