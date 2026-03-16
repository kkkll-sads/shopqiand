import React from 'react';
import {
  Award,
  Gem,
  HeadphonesIcon,
  MessageSquare,
  Settings,
  Sprout,
  UserCheck,
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
  onEditProfile: () => void;
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
  onEditProfile,
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
  const userTypeText = String(userInfoRecord.userTypeText ?? userInfoRecord.user_type_text ?? '');
  const agentLevel = readNumericValue(userInfoRecord.agentLevel ?? userInfoRecord.agent_level);
  const agentLevelText = String(
    userInfoRecord.agentLevelText ?? userInfoRecord.agent_level_text ?? '',
  );

  const levelColors: Record<number, { bg: string; border: string; text: string; dot: string }> = {
    0: {
      bg: 'bg-slate-50 dark:bg-slate-800/40',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'from-slate-400 to-slate-500',
    },
    1: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'from-emerald-400 to-emerald-600',
    },
    2: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800/40',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'from-blue-400 to-blue-600',
    },
    3: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800/40',
      text: 'text-purple-700 dark:text-purple-400',
      dot: 'from-purple-400 to-purple-600',
    },
    4: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800/40',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'from-amber-400 to-amber-600',
    },
    5: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-800/40',
      text: 'text-rose-700 dark:text-rose-400',
      dot: 'from-rose-400 to-rose-600',
    },
  };
  const lc = levelColors[agentLevel] ?? levelColors[0];

  const statusConfig: Record<number, { icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    0: { icon: Sprout },
    1: { icon: UserCheck },
    2: { icon: Gem },
  };
  const statusMeta = statusConfig[userType] ?? { icon: UserCheck };
  const UserTypeIcon = statusMeta.icon;
  const showLevelBadge = agentLevel > 0 && agentLevelText.length > 0;

  return (
    <div className="relative z-10 px-6 pb-2 pt-2 text-text-main">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onEditProfile}
          className="flex min-w-0 items-center gap-3 rounded-[28px] pr-2 text-left transition-opacity active:opacity-70"
        >
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-primary-start/10 text-xl font-bold text-primary-start shadow-sm">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt={'\u7528\u6237\u5934\u50cf'}
                className="h-full w-full object-cover"
              />
            ) : (
              displayAvatarText || '\u7528'
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h2 className="max-w-[132px] truncate text-xl font-bold leading-tight text-text-main">
                {displayName}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center whitespace-nowrap rounded-full border border-border-light bg-bg-card px-1.5 py-px shadow-sm">
                <div className="mr-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-br from-primary-start to-primary-end">
                  <UserTypeIcon size={7} className="fill-current text-white" />
                </div>
                <span className="text-3xs font-bold text-text-sub">{userTypeText || displayId}</span>
              </div>

              {showLevelBadge && (
                <div
                  className={`flex items-center whitespace-nowrap rounded-full border px-1.5 py-px ${lc.bg} ${lc.border}`}
                >
                  <div
                    className={`mr-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-br ${lc.dot}`}
                  >
                    <Award size={7} className="text-white" />
                  </div>
                  <span className={`text-3xs font-bold ${lc.text}`}>{agentLevelText}</span>
                </div>
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-5">
          <button
            onClick={onOpenHelp}
            className="flex flex-col items-center text-text-main active:opacity-70"
          >
            <HeadphonesIcon size={26} strokeWidth={1.5} />
            <span className="mt-0.5 text-2xs font-medium">{'\u5ba2\u670d'}</span>
          </button>

          <button
            onClick={() => onNavigate('message_center')}
            className="relative flex flex-col items-center text-text-main active:opacity-70"
          >
            <MessageSquare size={26} strokeWidth={1.5} />
            <span className="mt-0.5 text-2xs font-medium">{'\u6d88\u606f'}</span>
            {unreadCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-white bg-red-500 px-1 text-2xs font-bold leading-none text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center text-text-main active:opacity-70"
          >
            <Settings size={26} strokeWidth={1.5} />
            <span className="mt-0.5 text-2xs font-medium">{'\u8bbe\u7f6e'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
