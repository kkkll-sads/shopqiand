/**
 * usePaymentMethods - 支付方式管理 Hook
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCompanyAccountList, CompanyAccountItem } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export function usePaymentMethods() {
  const { showToast } = useNotification();

  const [allAccounts, setAllAccounts] = useState<CompanyAccountItem[]>([]);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  // 使用 ref 防止重复加载
  const loadedRef = useRef(false);

  // 加载账户列表 - 只在组件挂载时执行一次
  useEffect(() => {
    if (loadedRef.current) return;

    const loadAccounts = async () => {
      loadedRef.current = true;
      setLoading(true);

      try {
        const res = await fetchCompanyAccountList({ usage: 'recharge' });
        if (isSuccess(res)) {
          const list = res.data.list || [];
          setAllAccounts(list);

          // Extract unique payment methods
          const methodsMap = new Map<string, PaymentMethod>();
          list.forEach(acc => {
            if (!methodsMap.has(acc.type)) {
              methodsMap.set(acc.type, {
                id: acc.type,
                name: acc.type_text || acc.type,
                icon: acc.icon
              });
            }
          });
          setAvailableMethods(Array.from(methodsMap.values()));
        } else {
          showToast('error', '加载失败', '获取收款账户失败');
        }
      } catch (err) {
        errorLog('usePaymentMethods', '获取收款账户失败', err);
        showToast('error', '加载失败', '获取收款账户失败');
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [showToast]);

  // 重新加载函数
  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetchCompanyAccountList({ usage: 'recharge' });
      if (isSuccess(res)) {
        const list = res.data.list || [];
        setAllAccounts(list);

        const methodsMap = new Map<string, PaymentMethod>();
        list.forEach(acc => {
          if (!methodsMap.has(acc.type)) {
            methodsMap.set(acc.type, {
              id: acc.type,
              name: acc.type_text || acc.type,
              icon: acc.icon
            });
          }
        });
        setAvailableMethods(Array.from(methodsMap.values()));
      } else {
        showToast('error', '加载失败', '获取收款账户失败');
      }
    } catch (err) {
      errorLog('usePaymentMethods', '获取收款账户失败', err);
      showToast('error', '加载失败', '获取收款账户失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    allAccounts,
    availableMethods,
    loading,
    loadAccounts: reload,
  };
}
