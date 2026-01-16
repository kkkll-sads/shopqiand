import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import FriendDetail from './FriendDetail';
import { TeamMember } from '../../../types';

const FriendDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const friend = (location.state as { friend?: TeamMember })?.friend;
  
  return <FriendDetail id={id || ''} friend={friend} />;
};

export default FriendDetailWrapper;
