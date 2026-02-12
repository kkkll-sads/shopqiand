/**
 * FriendDetail - 好友详情页（新路由系统版）
 *
 * ✅ 已迁移：使用 React Router + useNavigate
 * ✅ 已对接：好友详情接口，显示层级和寄售收益
 *
 * @author 树交所前端团队
 * @version 4.0.0（API对接版）
 * @refactored 2026-01-21
 */

import React from 'react';
import { Wallet, Award, Users } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { normalizeAssetUrl } from '@/services';
import { TeamMember } from '@/types';
import { formatTime } from '@/utils/format';
import { useNavigate, useParams } from 'react-router-dom';
import { MemberDetailData } from '@/services/user/team';
import { formatAmount } from '@/utils/format';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { useFriendDetail } from './hooks/useFriendDetail';

interface FriendDetailProps {
  friend?: TeamMember;
  id?: string;
  memberDetail?: MemberDetailData;
}

const FriendDetail: React.FC<FriendDetailProps> = ({ friend: propFriend, id: propId, memberDetail: propMemberDetail }) => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const { friend: hookFriend, memberDetail: hookMemberDetail, loading, error } = useFriendDetail();
  
  // 优先使用传入的 props，其次使用 hook 加载的数据
  const id = propId || routeId || '';
  const friend = propFriend || hookFriend;
  const memberDetail = propMemberDetail || hookMemberDetail;

  // 加载中
  if (loading) {
    return (
      <PageContainer title="好友详情" onBack={() => navigate(-1)}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  // 错误状态
  if (error || !friend || !memberDetail) {
    return (
      <PageContainer title="好友详情" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
          <EmptyState title={error || '好友不存在'} />
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            返回
          </button>
        </div>
      </PageContainer>
    );
  }

  const joinDate =
    friend.join_date ||
    (friend.register_time ? friend.register_time.split(' ')[0] : '') ||
    (friend.join_time ? formatTime(friend.join_time, 'YYYY-MM-DD') : '-');

  const { user_info, level, level_text, consignment_income } = memberDetail;

  return (
    <PageContainer title="好友详情" onBack={() => navigate(-1)}>
      <div className="p-4 space-y-4">
        {/* 头部信息卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-orange-50 to-white -z-10" />

          <div className="w-20 h-20 rounded-full border-4 border-white shadow-md mb-3 overflow-hidden">
            <img
              src={normalizeAssetUrl(user_info.avatar) || '/static/images/avatar.png'}
              alt={user_info.nickname}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/static/images/avatar.png';
              }}
            />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {user_info.nickname || '未命名用户'}
          </h2>
          <p className="text-sm text-gray-500 mb-2">@{user_info.username}</p>
          
          {/* 层级标签 */}
          {level_text && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-full border border-orange-200">
              <Users size={12} className="text-orange-600" />
              <span className="text-xs font-medium text-orange-600">{level_text}</span>
            </div>
          )}
        </div>

        {/* 寄售收益卡片 */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 shadow-sm border border-orange-100">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-orange-600" />
            <h3 className="text-base font-bold text-gray-900">寄售收益</h3>
            <span className="text-xs text-gray-500 ml-auto">（含下级收益）</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* 可提现收益 */}
            <div className="bg-white rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                  <Wallet size={14} className="text-orange-600" />
                </div>
                <span className="text-xs text-gray-500">可提现收益</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-orange-600 leading-tight break-all">
                ¥{formatAmount(consignment_income.withdrawable_income)}
              </p>
            </div>

            {/* 消费金收益 */}
            <div className="bg-white rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                  <Award size={14} className="text-amber-600" />
                </div>
                <span className="text-xs text-gray-500">消费金收益</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-amber-600 leading-tight break-all">
                {formatAmount(consignment_income.score_income, { decimals: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* 详细信息列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">用户 ID</span>
            <span className="text-sm font-medium text-gray-900">{user_info.id}</span>
          </div>

          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">注册时间</span>
            <span className="text-sm font-medium text-gray-900">
              {user_info.register_time || joinDate || '-'}
            </span>
          </div>

          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">层级关系</span>
            <span className="text-sm font-medium text-gray-900">{level_text || '-'}</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default FriendDetail;
