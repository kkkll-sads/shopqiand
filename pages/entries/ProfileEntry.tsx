import React from 'react';
import Profile from '../user/Profile';
import { Route } from '../../router/routes';

interface ProfileEntryProps {
  onNavigate: (route: Route) => void;
  unreadCount?: number;
}

const ProfileEntry: React.FC<ProfileEntryProps> = ({ onNavigate, unreadCount }) => {
  return <Profile onNavigate={onNavigate} unreadCount={unreadCount} />;
};

export default ProfileEntry;

