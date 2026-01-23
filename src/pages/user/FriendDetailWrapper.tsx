import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FriendDetail from './FriendDetail';
import { TeamMember } from '../../../types';
import { fetchMemberDetail, MemberDetailData } from '../../../services/user';
import { extractData, extractError } from '../../../utils/apiHelpers';
import { LoadingSpinner, EmptyState } from '../../../components/common';
import { errorLog } from '../../../utils/logger';
import { useNotification } from '../../../context/NotificationContext';

const FriendDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  
  const [memberDetail, setMemberDetail] = useState<MemberDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('缺少好友ID');
      setLoading(false);
      return;
    }

    const loadMemberDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = parseInt(id, 10);
        if (isNaN(userId)) {
          setError('无效的用户ID');
          setLoading(false);
          return;
        }

        const response = await fetchMemberDetail({ user_id: userId });

        // 使用 extractData 判断，因为它支持 code === 0 或 code === 1
        const data = extractData(response);
        if (data) {
          setMemberDetail(data);
        } else {
          const errorMsg = extractError(response, '获取好友详情失败');
          setError(errorMsg);
          showToast('error', '获取失败', errorMsg);
        }
      } catch (err: any) {
        errorLog('FriendDetailWrapper', '加载好友详情失败', err);
        const errorMsg = err?.message || '网络错误，请稍后重试';
        setError(errorMsg);
        showToast('error', '加载失败', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadMemberDetail();
  }, [id, showToast]);

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // 错误状态
  if (error || !memberDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <EmptyState title={error || '好友不存在'} />
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  // 转换为 TeamMember 格式以兼容现有组件
  const friend: TeamMember = {
    id: memberDetail.user_info.id,
    username: memberDetail.user_info.username,
    nickname: memberDetail.user_info.nickname,
    avatar: memberDetail.user_info.avatar,
    mobile: '', // API 不返回手机号
    register_time: memberDetail.user_info.register_time,
    level: memberDetail.level,
    level_text: memberDetail.level_text,
  };

  return <FriendDetail id={id || ''} friend={friend} memberDetail={memberDetail} />;
};

export default FriendDetailWrapper;
