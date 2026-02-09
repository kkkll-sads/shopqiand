/**
 * useBalanceTransfer - 余额划转逻辑 Hook
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { transferIncomeToPurchase } from '@/services/api';
import { fetchProfile } from '@/services/user/profile';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

export function useBalanceTransfer() {
  const { showToast } = useNotification();

  const [transferAmount, setTransferAmount] = useState<string>('');
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(0);
  const [transferring, setTransferring] = useState(false);
  const transferRemark = '余额划转';

  // 防止重复加载
  const loadedRef = useRef(false);

  const loadUserBalance = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        return;
      }

      const res = await fetchProfile(token);
      if (isSuccess(res)) {
        const withdrawableMoney = Number(res.data.userInfo.withdrawable_money) || 0;
        setWithdrawableBalance(withdrawableMoney);
      }
    } catch (err) {
      errorLog('useBalanceTransfer', '加载用户余额失败', err);
    }
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadUserBalance();
  }, [loadUserBalance]);

  const handleTransfer = useCallback(async () => {
    const numAmount = Number(transferAmount);
    if (!transferAmount || isNaN(numAmount) || numAmount <= 0) {
      showToast('warning', '输入有误', '请输入有效的划转金额');
      return;
    }

    setTransferring(true);
    try {
      const response = await transferIncomeToPurchase({
        amount: numAmount,
        remark: transferRemark || '余额划转',
      });

      if (isSuccess(response)) {
        const { transfer_amount, remaining_withdrawable } = response.data || {};
        // 优先使用接口返回的金额，备选使用用户输入的金额
        const displayAmount = transfer_amount ?? numAmount;
        showToast('success', '划转成功', `成功划转 ¥${displayAmount} 到可用余额`);

        if (typeof remaining_withdrawable === 'number') {
          setWithdrawableBalance(remaining_withdrawable);
        }
        await loadUserBalance();
        setTransferAmount('');
      } else {
        showToast('error', '划转失败', response.msg || '余额划转失败，请重试');
      }
    } catch (error) {
      errorLog('useBalanceTransfer', '余额划转失败', error);
      showToast('error', '划转失败', '网络错误，请重试');
    } finally {
      setTransferring(false);
    }
  }, [transferAmount, transferRemark, showToast, loadUserBalance]);

  return {
    transferAmount,
    setTransferAmount,
    withdrawableBalance,
    transferring,
    handleTransfer,
    loadUserBalance,
  };
}
