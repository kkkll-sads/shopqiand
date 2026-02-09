import { useState, useCallback } from 'react';
import { fetchProfile } from '@/services';
import { getStoredToken } from '@/services/client';
import {
  getRightsDeclarationList,
  getRightsDeclarationReviewStatus,
  type RightsDeclarationRecord,
} from '@/services/rightsDeclaration';
import { UserInfo } from '@/types';
import { isSuccess, extractData } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

/**
 * useClaimData - 管理确权页的用户信息、历史记录、审核统计
 *
 * 设计目的：
 * 1) 将数据获取逻辑与 UI 解耦，减少 ClaimStation 组件体积
 * 2) 统一处理 token 获取与错误提示（由外部传入 showToast）
 * 3) 提供独立的加载方法，方便提交后刷新列表/统计
 */
export function useClaimData(showToast: (type: string, title: string, message?: string) => void) {
  // 用户信息
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  // 申报历史
  const [history, setHistory] = useState<RightsDeclarationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // 审核状态统计
  const [reviewStats, setReviewStats] = useState({
    pending_count: 0,
    approved_count: 0,
    isLoading: true,
  });

  /**
   * 读取本地 token，缺失时提示并返回 null
   */
  const ensureToken = useCallback(() => {
    const token = getStoredToken();
    if (!token) {
      showToast('error', '登录过期', '请重新登录');
      return null;
    }
    return token;
  }, [showToast]);

  /**
   * 加载用户信息 + 历史记录 + 审核统计
   * 说明：整体串行即可，保持与原逻辑一致；单点异常不会阻断其他请求
   */
  const loadInitialData = useCallback(async () => {
    const token = ensureToken();
    if (!token) return null;

    try {
      const res = await fetchProfile(token);
      const data = extractData(res);
      if (data?.userInfo) {
        setUserInfo(data.userInfo);
      }
    } catch (error) {
      errorLog('useClaimData', '获取用户信息失败', error);
    }

    await loadHistory(token);
    await loadReviewStats(token);
    return token;
  }, [ensureToken]);

  /**
   * 加载申报历史记录
   */
  const loadHistory = useCallback(
    async (token?: string) => {
      const finalToken = token || ensureToken();
      if (!finalToken) return;

      setHistoryLoading(true);
      try {
        const res = await getRightsDeclarationList({ limit: 10 }, finalToken);
        const data = extractData(res);
        if (data?.list) {
          setHistory(data.list);
        }
      } catch (error) {
        errorLog('useClaimData', '获取申报历史失败', error);
        showToast('error', '加载失败', '获取申报历史失败');
      } finally {
        setHistoryLoading(false);
      }
    },
    [ensureToken, showToast],
  );

  /**
   * 加载审核状态统计
   */
  const loadReviewStats = useCallback(
    async (token?: string) => {
      const finalToken = token || ensureToken();
      if (!finalToken) return;

      try {
        const res = await getRightsDeclarationReviewStatus({}, finalToken);
        const data = extractData(res);
        if (data) {
          setReviewStats({
            pending_count: data.pending_count,
            approved_count: data.approved_count,
            isLoading: false,
          });
        }
      } catch (error) {
        errorLog('useClaimData', '获取审核统计失败', error);
        setReviewStats((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureToken],
  );

  return {
    userInfo,
    setUserInfo,
    history,
    historyLoading,
    reviewStats,
    loadInitialData,
    loadHistory,
    loadReviewStats,
  };
}

export default useClaimData;

