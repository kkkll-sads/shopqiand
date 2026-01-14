import React from 'react';
import { useParams } from 'react-router-dom';
import FriendDetail from '../../../pages/user/FriendDetail';

const FriendDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // friend data would need to be passed via location.state or fetched
  return <FriendDetail id={id} />;
};

export default FriendDetailWrapper;
