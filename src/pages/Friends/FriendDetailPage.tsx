/**
 * @file Friends/FriendDetailPage.tsx - 好友详情页
 * @description 展示好友基本信息、注册时间、寄售可提现收益、消费金收益。
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, Award, Coins, User } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { teamApi, type MemberDetailData } from '../../api';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';

export const FriendDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<MemberDetailData | null>(null);

  useEffect(() => {
    const userId = id ? parseInt(id, 10) : NaN;
    if (!id || isNaN(userId)) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    teamApi
      .getMemberDetail(userId)
      .then(setDetail)
      .catch(() => {
        setError(true);
        showToast({ message: '好友详情加载失败', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col bg-bg-base">
        <div className="flex h-12 items-center border-b border-border-light bg-white px-4 dark:bg-gray-900">
          <button type="button" onClick={() => goBack()} className="-ml-2 p-2 text-text-main active:opacity-70">
            <ChevronLeft size={20} />
          </button>
          <span className="ml-2 text-xl font-medium text-text-main">好友详情</span>
        </div>
        <div className="flex-1">
          <ErrorState onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col bg-bg-base">
        <div className="flex h-12 items-center border-b border-border-light bg-white px-4 dark:bg-gray-900">
          <button type="button" onClick={() => goBack()} className="-ml-2 p-2 text-text-main">
            <ChevronLeft size={20} />
          </button>
          <span className="ml-2 text-xl font-medium text-text-main">好友详情</span>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex flex-col items-center rounded-xl bg-white p-6 dark:bg-gray-900">
            <Skeleton className="mb-4 h-20 w-20 rounded-full" />
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-4 rounded-xl bg-white p-4 dark:bg-gray-900">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const { user_info, level, level_text, consignment_income } = detail;

  return (
    <div className="flex flex-1 flex-col bg-bg-base">
      <div className="sticky top-0 z-20 flex h-12 items-center border-b border-border-light bg-white px-4 dark:bg-gray-900">
        <button type="button" onClick={() => goBack()} className="-ml-2 p-2 text-text-main active:opacity-70">
          <ChevronLeft size={20} />
        </button>
        <span className="ml-2 text-xl font-medium text-text-main">好友详情</span>
      </div>

      <div className="space-y-4 p-4">
        {/* Profile Card */}
        <div className="relative flex flex-col items-center overflow-hidden rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <div className="absolute top-0 left-0 h-24 w-full bg-gradient-to-b from-primary-start/10 to-transparent" />

          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-800">
            {user_info.avatar ? (
              <img
                src={user_info.avatar}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={32} className="text-text-aux" />
            )}
          </div>

          <h2 className="z-10 mb-1 mt-3 text-2xl font-bold text-text-main">
            {user_info.username && user_info.username !== '未实名'
            ? user_info.username
            : user_info.nickname || user_info.username}
          </h2>
          <div className="z-10 mb-3 font-mono text-s text-text-sub">ID: {user_info.id}</div>

          <span
            className={`z-10 rounded-full border px-3 py-1 text-s font-medium ${
              level === 1
                ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/20'
                : 'border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-900/20'
            }`}
          >
            {level_text}
          </span>
        </div>

        {/* Info List */}
        <div className="rounded-xl bg-white p-2 shadow-sm dark:bg-gray-900">
          <div className="flex items-center border-b border-border-light p-3 last:border-0">
            <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
              <Calendar size={16} className="text-text-sub" />
            </div>
            <div className="flex-1">
              <div className="mb-0.5 text-sm font-medium text-text-main">注册时间</div>
              <div className="text-s text-text-sub">{user_info.register_time}</div>
            </div>
          </div>

          <div className="flex items-center border-b border-border-light p-3 last:border-0">
            <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
              <Coins size={16} className="text-primary-start" />
            </div>
            <div className="flex-1">
              <div className="mb-0.5 text-sm font-medium text-text-main">寄售可提现收益</div>
              <div className="text-lg font-bold text-primary-start">
                ¥{consignment_income.withdrawable_income}
              </div>
            </div>
          </div>

          <div className="flex items-center border-b border-border-light p-3 last:border-0">
            <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
              <Award size={16} className="text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="mb-0.5 text-sm font-medium text-text-main">消费金收益</div>
              <div className="text-lg font-bold text-orange-500">
                {consignment_income.score_income}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
