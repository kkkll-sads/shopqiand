import React from 'react';
import {
  Settings,
  MessageSquare,
  HeadphonesIcon,
  Sprout,
  UserCheck,
  Gem,
  Award,
} from 'lucide-react';
import type { UserInfo } from '@/types';

interface ProfileHeaderProps {
  userInfo: UserInfo | null;
  displayName: string;
  displayAvatarText: string;
  displayAvatarUrl: string;
  displayId: string;
  unreadCount: number;
  onNavigate: (path: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userInfo,
  displayName,
  displayAvatarText,
  displayAvatarUrl,
  displayId,
  unreadCount,
  onNavigate,
}) => {
  return (
    <div className="pt-4 pb-2 px-6 relative z-10 text-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-xl font-bold text-red-600 overflow-hidden shadow-sm">
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="用户头像" className="w-full h-full object-cover" />
            ) : (
              displayAvatarText || '用'
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h2>

            <div className="flex items-center gap-2">
              <div className="flex items-center profile-user-type-pill rounded-full px-2 py-0.5">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mr-1 shadow-sm">
                  {(() => {
                    const statusConfig = {
                      0: { icon: Sprout },
                      1: { icon: UserCheck },
                      2: { icon: Gem },
                    }[userInfo?.user_type ?? -1] || { icon: UserCheck };
                    const Icon = statusConfig.icon;
                    return <Icon size={8} className="text-white fill-current" />;
                  })()}
                </div>
                <span className="text-[10px] font-bold text-gray-700">{displayId}</span>
              </div>

              {userInfo?.agent_review_status === 1 && (
                <div className="flex items-center bg-red-50 rounded-full px-2 py-0.5 border border-red-100">
                  <Award size={10} className="text-red-500 mr-1" />
                  <span className="text-[10px] font-bold text-red-600">代理</span>
                </div>
              )}
              {userInfo?.agent_review_status === 0 && (
                <div className="flex items-center bg-yellow-50 rounded-full px-2 py-0.5 border border-yellow-100">
                  <Award size={10} className="text-yellow-600 mr-1" />
                  <span className="text-[10px] font-bold text-yellow-700">待审核</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={() => onNavigate('/online-service')}
            className="flex flex-col items-center text-gray-700 active:opacity-70"
          >
            <HeadphonesIcon size={26} strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 font-medium">客服</span>
          </button>

          <button
            onClick={() => onNavigate('/message-center')}
            className="flex flex-col items-center text-gray-700 active:opacity-70 relative"
          >
            <MessageSquare size={26} strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 font-medium">消息</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white box-content"></span>
            )}
          </button>

          <button
            onClick={() => onNavigate('/settings')}
            className="flex flex-col items-center text-gray-700 active:opacity-70"
          >
            <Settings size={26} strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 font-medium">设置</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
