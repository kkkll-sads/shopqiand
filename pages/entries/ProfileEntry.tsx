import React from 'react';
import Profile from '../user/Profile';
import { Route } from '../../router/routes';

interface ProfileEntryProps {
  onNavigate: (route: Route) => void;
}

const ProfileEntry: React.FC<ProfileEntryProps> = ({ onNavigate }) => {
  return <Profile onNavigate={onNavigate} />;
};

export default ProfileEntry;

