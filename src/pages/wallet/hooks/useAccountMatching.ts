/**
 * useAccountMatching - 账户匹配逻辑 Hook
 */
import { useState, useCallback } from 'react';
import { CompanyAccountItem, submitRechargeOrder } from '@/services';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { warnLog } from '@/utils/logger';

interface UseAccountMatchingParams {
  amount: string;
  selectedMethod: string | null;
  allAccounts: CompanyAccountItem[];
  onMatched: (account: CompanyAccountItem) => void;
  onPaymentUrl: (url: string, orderId: string | null) => void;
  onError: () => void;
}

export function useAccountMatching({
  amount,
  selectedMethod,
  allAccounts,
  onMatched,
  onPaymentUrl,
  onError,
}: UseAccountMatchingParams) {
  const { showToast } = useNotification();
  const { handleError } = useErrorHandler({ showToast: true, persist: false });

  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [availableAccounts, setAvailableAccounts] = useState<CompanyAccountItem[]>([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);

  // Helper: Check if amount is within the range specified in remark
  const isAmountInRange = useCallback((amount: number, rangeStr: string): boolean => {
    if (!rangeStr) return true;
    try {
      const match = rangeStr.match(/(\d+)\s*-\s*(\d+)/);
      if (match) {
        const min = Number(match[1]);
        const max = Number(match[2]);
        if (!isNaN(min) && !isNaN(max)) {
          return amount >= min && amount <= max;
        }
      }
    } catch (e) {
      warnLog('useAccountMatching', 'Failed to parse range', { rangeStr, error: e });
    }
    return true;
  }, []);

  const trySubmitWithAccount = useCallback(async (accounts: CompanyAccountItem[], index: number) => {
    // 检查是否已尝试所有账户
    if (index >= accounts.length) {
      showToast('error', '通道不可用', '所有支付通道暂时无法使用，请稍后重试');
      onError();
      return;
    }

    // 检查是否达到最大重试次数
    if (index >= maxRetries) {
      showToast('error', '重试失败', `已尝试 ${maxRetries} 个通道，请稍后重试或联系客服`);
      onError();
      return;
    }

    const selected = accounts[index];
    onMatched(selected);

    // 银行卡通道：直接显示收款账户信息页面
    if (selectedMethod === 'bank_card') {
      return;
    }

    // 其他通道：尝试自动提交
    try {
      const response = await submitRechargeOrder({
        company_account_id: selected.id,
        amount: Number(amount),
        payment_type: selectedMethod || undefined,
        payment_method: 'online',
      });

      if (isSuccess(response)) {
        const { pay_url, order_id, order_no } = response.data || {};

        if (pay_url) {
          showToast('success', '订单创建成功', '正在加载支付页面...');
          const resolvedOrderId = order_id ?? order_no ?? null;
          onPaymentUrl(String(pay_url), resolvedOrderId === null ? null : String(resolvedOrderId));
        } else {
          // Fallback to manual view if no pay_url
          onMatched(selected);
        }
      } else {
        // 失败：判断是否需要重试
        const errorMsg = response.msg || '';
        const shouldRetry =
          errorMsg.includes('获取支付链接失败') ||
          errorMsg.includes('未获取到支付地址') ||
          errorMsg.includes('Exception:') ||
          errorMsg.includes('Stack trace:');

        if (shouldRetry && index < accounts.length - 1 && index < maxRetries - 1) {
          // 静默重试
          const nextIndex = index + 1;
          setRetryCount(nextIndex);
          setCurrentAccountIndex(nextIndex);

          setTimeout(() => {
            trySubmitWithAccount(accounts, nextIndex);
          }, 500);
        } else {
          let friendlyMessage = errorMsg || '充值通道维护中';
          if (shouldRetry) {
            friendlyMessage = '当前支付通道暂时无法使用，请稍后重试或更换其他支付方式';
          }

          handleError(response, {
            toastTitle: '创建订单失败',
            customMessage: friendlyMessage,
            context: { amount: Number(amount), accountId: selected.id }
          });
          onError();
        }
      }
    } catch (error) {
      // 网络错误：静默尝试下一个通道
      if (index < accounts.length - 1 && index < maxRetries - 1) {
        const nextIndex = index + 1;
        setRetryCount(nextIndex);
        setCurrentAccountIndex(nextIndex);

        setTimeout(() => {
          trySubmitWithAccount(accounts, nextIndex);
        }, 500);
      } else {
        handleError(error, {
          toastTitle: '创建订单失败',
          customMessage: '网络错误，请重试',
          context: { amount: Number(amount), accountId: selected.id }
        });
        onError();
      }
    }
  }, [amount, selectedMethod, maxRetries, showToast, handleError, onMatched, onPaymentUrl, onError]);

  const startMatching = useCallback(() => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount < 100) {
      showToast('warning', '输入有误', '最低申购金额为 100 元');
      return;
    }
    if (!selectedMethod) {
      showToast('warning', '请选择', '请选择支付方式');
      return;
    }

    setTimeout(async () => {
      // 筛选并排序账户
      const filteredAccounts = allAccounts.filter(acc => {
        const typeMatch = acc.type === selectedMethod;
        const rangeMatch = isAmountInRange(Number(amount), acc.remark);
        return typeMatch && rangeMatch;
      });

      // 预处理：先随机打乱
      for (let i = filteredAccounts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredAccounts[i], filteredAccounts[j]] = [filteredAccounts[j], filteredAccounts[i]];
      }

      // 排序逻辑：支付宝和微信第一次匹配排序高的，后续随机选择
      let validAccounts = [...filteredAccounts];
      if (selectedMethod === 'alipay' || selectedMethod === 'wechat') {
        const hasMatchedKey = `HAS_MATCHED_${selectedMethod.toUpperCase()}`;
        const hasMatched = sessionStorage.getItem(hasMatchedKey);

        if (!hasMatched) {
          // 第一次：按 sort 升序
          validAccounts.sort((a, b) => {
            const sortA = typeof a.sort === 'number' ? a.sort : Number.MAX_SAFE_INTEGER;
            const sortB = typeof b.sort === 'number' ? b.sort : Number.MAX_SAFE_INTEGER;
            return sortA - sortB;
          });
          sessionStorage.setItem(hasMatchedKey, 'true');
        } else {
          // 后续：随机打乱
          for (let i = validAccounts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validAccounts[i], validAccounts[j]] = [validAccounts[j], validAccounts[i]];
          }
        }
      } else {
        // 其他方式：保持按 sort 升序
        validAccounts.sort((a, b) => {
          const sortA = typeof a.sort === 'number' ? a.sort : Number.MAX_SAFE_INTEGER;
          const sortB = typeof b.sort === 'number' ? b.sort : Number.MAX_SAFE_INTEGER;
          return sortA - sortB;
        });
      }

      if (validAccounts.length > 0) {
        setAvailableAccounts(validAccounts);
        setCurrentAccountIndex(0);
        setRetryCount(0);
        await trySubmitWithAccount(validAccounts, 0);
      } else {
        showToast('error', '匹配失败', '当前金额暂无匹配通道，请调整金额重试');
        onError();
      }
    }, 2500);
  }, [amount, selectedMethod, allAccounts, isAmountInRange, trySubmitWithAccount, showToast, onError]);

  return {
    startMatching,
    retryCount,
  };
}
