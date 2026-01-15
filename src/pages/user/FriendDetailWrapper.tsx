import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FriendDetail from '../../../pages/user/FriendDetail';

const FriendDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  // friend data would need to be passed via location.state or fetched
  return <FriendDetail id={id} onBack={() => navigate(-1)} />;
};

export default FriendDetailWrapper;
