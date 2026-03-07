/**
 * useCashier - 收银台业务 Hook
 *
 * 功能说明：
 * - 封装收银台的完整状态管理逻辑
 * - 使用状态机模式确保状态互斥
 * - 处理订单加载和支付流程
 * - 统一错误处理
 *
 * @author 树交所前端团队
 * @version 1.0.0
 * @created 2026-01-14
 */

import { useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useStateMachine } from './useStateMachine';
import { errorLog } from '@/utils/logger';
import {
  payOrder,
  getOrderDetail,
  fetchProfile,
  type ShopOrderDetail,
  type ShopOrderPaymentType,
} from '@/services';
import { getStoredToken } from '@/services/client';
import {
  isSuccess as checkApiSuccess,
  extractData,
  extractError,
  extractErrorFromException,
} from '@/utils/apiHelpers';
import { CashierState, CashierEvent } from '@/types/states';

/**
 * 收银台上下文数据
 */
interface CashierContext {
  /** 订单信息 */
  order: ShopOrderDetail | null;
  /** 错误信息 */
  error: string | null;
  /** 支付方式 */
  payType: ShopOrderPaymentType;
  /** 用户余额信息 */
  userBalance: {
    score: number;
    balance_available: string;
  };
}

/**
 * 状态转换表
 */
const CASHIER_TRANSITIONS: Record<CashierState, Partial<Record<CashierEvent, CashierState>>> = {
  [CashierState.IDLE]: {
    [CashierEvent.LOAD]: CashierState.LOADING,
  },
  [CashierState.LOADING]: {
    [CashierEvent.LOAD_SUCCESS]: CashierState.READY,
    [CashierEvent.LOAD_ERROR]: CashierState.ERROR,
  },
  [CashierState.READY]: {
    [CashierEvent.PAY]: CashierState.PAYING,
    [CashierEvent.CHANGE_PAY_TYPE]: CashierState.READY,
  },
  [CashierState.PAYING]: {
    [CashierEvent.PAY_SUCCESS]: CashierState.SUCCESS,
    [CashierEvent.PAY_ERROR]: CashierState.READY,
  },
  [CashierState.SUCCESS]: {},
  [CashierState.ERROR]: {
    [CashierEvent.RETRY]: CashierState.LOADING,
  },
};

/**
 * Hook返回值
 */
interface UseCashierReturn {
  state: CashierState;
  context: CashierContext;
  isLoading: boolean;
  isReady: boolean;
  isPaying: boolean;
  isSuccess: boolean;
  hasError: boolean;
  loadData: () => Promise<void>;
  handlePay: () => Promise<void>;
  handleRetry: () => void;
  setPayType: (payType: ShopOrderPaymentType) => void;
}

export function useCashier(orderId: string): UseCashierReturn {
  const { showToast } = useNotification();

  const { state, context, send, setContext } = useStateMachine<
    CashierState,
    CashierEvent,
    CashierContext
  >({
    initial: CashierState.IDLE,
    transitions: CASHIER_TRANSITIONS,
    context: {
      order: null,
      error: null,
      payType: 'money',
      userBalance: {
        score: 0,
        balance_available: '0.00',
      },
    },
    debug: process.env.NODE_ENV === 'development',
  });

  const loadData = async () => {
    send(CashierEvent.LOAD);

    try {
      const token = getStoredToken() || '';

      const [orderRes, profileRes] = await Promise.all([
        getOrderDetail({ id: orderId, token }),
        fetchProfile(token),
      ]);

      const orderData = extractData(orderRes);
      if (!orderData) {
        const errorMsg = extractError(orderRes, '无法加载订单信息');
        setContext({ error: errorMsg });
        send(CashierEvent.LOAD_ERROR);
        showToast('error', '获取订单失败', errorMsg);
        return;
      }

      const profileData = extractData(profileRes);
      const finalBalance = {
        score: Number(profileData?.userInfo?.score) || 0,
        balance_available: String(profileData?.userInfo?.balance_available ?? profileData?.userInfo?.money ?? '0.00'),
      };

      if (orderData.score !== undefined && orderData.score !== null) {
        finalBalance.score = Number(orderData.score);
      }
      if (orderData.balance_available !== undefined && orderData.balance_available !== null) {
        finalBalance.balance_available = String(orderData.balance_available);
      }

      setContext({
        order: orderData,
        userBalance: finalBalance,
        payType: orderData.pay_type || 'money',
        error: null,
      });

      send(CashierEvent.LOAD_SUCCESS);
    } catch (error: unknown) {
      errorLog('useCashier', '加载收银台数据失败', error);
      const errorMsg = extractErrorFromException(error, '网络错误');
      setContext({ error: errorMsg });
      send(CashierEvent.LOAD_ERROR);
      showToast('error', '加载失败', errorMsg);
    }
  };

  const handlePay = async () => {
    if (!send(CashierEvent.PAY)) {
      return;
    }

    try {
      const token = getStoredToken() || '';
      const res = await payOrder({ id: orderId, token });

      if (checkApiSuccess(res)) {
        send(CashierEvent.PAY_SUCCESS);
        showToast('success', extractError(res, '支付成功'));
      } else {
        const errorMsg = extractError(res, '支付失败');
        setContext({ error: errorMsg });
        send(CashierEvent.PAY_ERROR);
        showToast('error', '支付失败', errorMsg);
      }
    } catch (error: unknown) {
      errorLog('useCashier', '支付失败', error);
      const errorMsg = extractErrorFromException(error, '网络错误');
      setContext({ error: errorMsg });
      send(CashierEvent.PAY_ERROR);
      showToast('error', '支付失败', errorMsg);
    }
  };

  const handleRetry = () => {
    send(CashierEvent.RETRY);
    void loadData();
  };

  const setPayType = (payType: ShopOrderPaymentType) => {
    setContext({ payType });
    send(CashierEvent.CHANGE_PAY_TYPE);
  };

  useEffect(() => {
    if (state === CashierState.IDLE) {
      void loadData();
    }
  }, [orderId, state]);

  const isLoading = state === CashierState.LOADING;
  const isReady = state === CashierState.READY;
  const isPaying = state === CashierState.PAYING;
  const isSuccess = state === CashierState.SUCCESS;
  const hasError = state === CashierState.ERROR;

  return {
    state,
    context,
    isLoading,
    isReady,
    isPaying,
    isSuccess,
    hasError,
    loadData,
    handlePay,
    handleRetry,
    setPayType,
  };
}

export default useCashier;
