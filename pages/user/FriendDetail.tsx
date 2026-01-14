/**
 * FriendDetail - 好友详情页（新路由系统版）
 *
 * ✅ 已迁移：使用 usePageNavigation 替代 Props
 *
 * @author 树交所前端团队
 * @version 3.0.0（新路由版）
 * @refactored 2026-01-14
 */

import React from 'react';
import PageContainer from '../../components/layout/PageContainer';
import { normalizeAssetUrl } from '../../services/api';
import { TeamMember } from '../../types';
import { formatTime } from '../../utils/format';
import { usePageNavigation } from '../../src/hooks/usePageNavigation';

interface FriendDetailProps {
  friend?: TeamMember;
  id: string;
}

const FriendDetail: React.FC<FriendDetailProps> = ({ friend, id }) => {
  const { goBack } = usePageNavigation();
  // 如果没有传入 friend 对象，可以显示加载中或者空状态
  // 由于目前 API 不支持单独获取好友详情，这里先假设通过 props 传入
  // 如果 future 需要支持 deep link，则需要增加 API 调用

  if (!friend) {
    return (
      <PageContainer title="好友详情" onBack={goBack}>
        <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
          <p>未找到好友信息</p>
          <p className="text-xs mt-2">ID: {id}</p>
        </div>
      </PageContainer>
    );
  }

  const joinDate =
    friend.join_date ||
    (friend.register_time ? friend.register_time.split(' ')[0] : '') ||
    (friend.join_time ? formatTime(friend.join_time, 'YYYY-MM-DD') : '-');

  return (
    <PageContainer title="好友详情" onBack={goBack}>
      <div className="p-4 space-y-4">
        {/* 头部信息卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-orange-50 to-white -z-10" />

          <div className="w-20 h-20 rounded-full border-4 border-white shadow-md mb-3 overflow-hidden">
            <img
              src={normalizeAssetUrl(friend.avatar) || '/static/images/avatar.png'}
              alt={friend.nickname}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/static/images/avatar.png';
              }}
            />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {friend.nickname || '未命名用户'}
          </h2>
          <p className="text-sm text-gray-500">@{friend.username}</p>
        </div>

        {/* 详细信息列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">用户 ID</span>
            <span className="text-sm font-medium text-gray-900">{friend.id}</span>
          </div>

          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">手机号</span>
            <span className="text-sm font-medium text-gray-900">{friend.mobile || '-'}</span>
          </div>

          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">加入日期</span>
            <span className="text-sm font-medium text-gray-900">{joinDate}</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default FriendDetail;
