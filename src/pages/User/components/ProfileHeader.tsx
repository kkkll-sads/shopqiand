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
import type { AccountProfileUserInfo } from '../../../api/modules/account';

export interface ProfileHeaderProps {
  userInfo: AccountProfileUserInfo | Record<string, unknown> | null;
  displayName: string;
  displayAvatarText: string;
  displayAvatarUrl: string;
  displayId: string;
  unreadCount: number;
  onNavigate: (viewId: string) => void;
  onOpenHelp: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userInfo,
  displayName,
  displayAvatarText,
  displayAvatarUrl,
  displayId,
  unreadCount,
  onNavigate,
  onOpenHelp,
}) => {
  const userInfoRecord = (userInfo ?? {}) as Record<string, unknown>;
  const readNumericValue = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const nextValue = Number.parseInt(value, 10);
      return Number.isFinite(nextValue) ? nextValue : -1;
    }

    return -1;
  };
  const userType = readNumericValue(userInfoRecord.userType ?? userInfoRecord.user_type);
  const agentReviewStatus = readNumericValue(
    userInfoRecord.agentReviewStatus ?? userInfoRecord.agent_review_status,
  );

  const statusConfig: Record<number, { icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    0: { icon: Sprout },
    1: { icon: UserCheck },
    2: { icon: Gem },
  };
  const statusMeta = statusConfig[userType] ?? { icon: UserCheck };
  const UserTypeIcon = statusMeta.icon;

  return (
    <div className="pt-2 pb-2 px-6 relative z-10 text-text-main">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary-start/10 border-2 border-white flex items-center justify-center text-xl font-bold text-primary-start overflow-hidden shadow-sm">
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="用户头像" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              displayAvatarText || '用'
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-text-main leading-tight">{displayName}</h2>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-full px-2 py-0.5 bg-bg-card border border-border-light shadow-sm">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center mr-1">
                  <UserTypeIcon size={8} className="text-white fill-current" />
                </div>
                <span className="text-[10px] font-bold text-text-sub">{displayId}</span>
              </div>

              {agentReviewStatus === 1 && (
                <div className="flex items-center bg-red-50 dark:bg-red-900/20 rounded-full px-2 py-0.5 border border-red-100 dark:border-red-800/40">
                  <Award size={10} className="text-red-500 mr-1" />
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400">代理</span>
                </div>
              )}
              {agentReviewStatus === 0 && (
                <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 rounded-full px-2 py-0.5 border border-yellow-100 dark:border-yellow-800/40">
                  <Award size={10} className="text-yellow-600 mr-1" />
                  <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400">待审核</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={onOpenHelp}
            className="flex flex-col items-center text-text-main active:opacity-70"
          >
            <HeadphonesIcon size={26} strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 font-medium">客服</span>
          </button>

          <button
            onClick={() => onNavigate('message_center')}
            className="flex flex-col items-center text-text-main active:opacity-70 relative"
          >
            <MessageSquare size={26} strokeWidth={1.5} />
            <span className="text-[10px] mt-0.5 font-medium">消息</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none border border-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center text-text-main active:opacity-70"
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
