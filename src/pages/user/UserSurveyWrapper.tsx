/**
 * UserSurvey 用户问卷页面包装器
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserSurvey from '../../../pages/user/UserSurvey';

const UserSurveyWrapper: React.FC = () => {
  const navigate = useNavigate();

  return <UserSurvey onBack={() => navigate(-1)} onSuccess={() => navigate(-1)} />;
};

export default UserSurveyWrapper;
