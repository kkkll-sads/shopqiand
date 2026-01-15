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
import { useNotification } from '../context/NotificationContext';
import { useStateMachine } from './useStateMachine';
import {
  payOrder,
  getOrderDetail,
  fetchProfile,
  ShopOrderItem,
} from '../services/api';
import { getStoredToken } from '../services/client';
import { isSuccess, extractData, extractError } from '../utils/apiHelpers';
import { CashierState, CashierEvent } from '../types/states';

/**
 * 收银台上下文数据
 */
interface CashierContext {
  /** 订单信息 */
  order: ShopOrderItem | null;
  /** 错误信息 */
  error: string | null;
  /** 支付方式 */
  payType: 'money' | 'score' | 'combined';
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
    [CashierEvent.CHANGE_PAY_TYPE]: CashierState.READY, // 切换支付方式保持READY状态
  },
  [CashierState.PAYING]: {
    [CashierEvent.PAY_SUCCESS]: CashierState.SUCCESS,
    [CashierEvent.PAY_ERROR]: CashierState.READY, // 支付失败返回READY状态
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
  // 状态
  state: CashierState;
  context: CashierContext;

  // 派生状态
  isLoading: boolean;
  isReady: boolean;
  isPaying: boolean;
  isSuccess: boolean;
  hasError: boolean;

  // 方法
  loadData: () => Promise<void>;
  handlePay: () => Promise<void>;
  handleRetry: () => void;
  setPayType: (payType: 'money' | 'score' | 'combined') => void;
}

/**
 * useCashier Hook
 *
 * @param orderId - 订单ID
 * @returns Hook返回值
 *
 * @example
 * ```tsx
 * const { state, context, isLoading, handlePay } = useCashier(orderId);
 *
 * if (isLoading) return <LoadingSpinner />;
 *
 * return (
 *   <button onClick={handlePay} disabled={isPaying}>
 *     {isPaying ? '支付中...' : '确认支付'}
 *   </button>
 * );
 * ```
 */
export function useCashier(orderId: string): UseCashierReturn {
  const { showToast } = useNotification();

  // 初始化状态机
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

  /**
   * 加载订单和用户信息
   */
  const loadData = async () => {
    send(CashierEvent.LOAD);

    try {
      const token = getStoredToken() || '';

      // 并行获取订单和用户信息
      const [orderRes, profileRes] = await Promise.all([
        getOrderDetail({ id: orderId, token }),
        fetchProfile(token),
      ]);

      // 处理订单数据
      const orderData = extractData(orderRes);
      if (!orderData) {
        const errorMsg = extractError(orderRes, '无法加载订单信息');
        setContext({ error: errorMsg });
        send(CashierEvent.LOAD_ERROR);
        showToast('error', '获取订单失败', errorMsg);
        return;
      }

      // 处理用户信息
      const profileData = extractData(profileRes);
      const finalBalance = {
        score: profileData?.userInfo?.score || 0,
        balance_available: profileData?.userInfo?.money || '0.00',
      };

      // 如果订单数据包含余额信息，优先使用
      if (orderData.score !== undefined && orderData.score !== null) {
        finalBalance.score = Number(orderData.score);
      }
      if (orderData.balance_available !== undefined && orderData.balance_available !== null) {
        finalBalance.balance_available = String(orderData.balance_available);
      }

      // 更新上下文
      setContext({
        order: orderData,
        userBalance: finalBalance,
        payType: (orderData.pay_type as 'money' | 'score' | 'combined') || 'money',
        error: null,
      });

      send(CashierEvent.LOAD_SUCCESS);
    } catch (error: any) {
      console.error('Load cashier data failed', error);
      const errorMsg = error.message || '网络错误';
      setContext({ error: errorMsg });
      send(CashierEvent.LOAD_ERROR);
      showToast('error', '加载失败', errorMsg);
    }
  };

  /**
   * 处理支付
   */
  const handlePay = async () => {
    if (!send(CashierEvent.PAY)) {
      return; // 状态转换失败，阻止支付
    }

    try {
      const token = getStoredToken() || '';
      const res = await payOrder({ id: orderId, token });

      if (isSuccess(res)) {
        send(CashierEvent.PAY_SUCCESS);
        showToast('success', extractError(res, '支付成功'));
      } else {
        const errorMsg = extractError(res, '支付失败');
        setContext({ error: errorMsg });
        send(CashierEvent.PAY_ERROR);
        showToast('error', '支付失败', errorMsg);
      }
    } catch (error: any) {
      console.error('Payment failed', error);
      const errorMsg = error.message || '网络错误';
      setContext({ error: errorMsg });
      send(CashierEvent.PAY_ERROR);
      showToast('error', '支付失败', errorMsg);
    }
  };

  /**
   * 重试加载
   */
  const handleRetry = () => {
    send(CashierEvent.RETRY);
    loadData();
  };

  /**
   * 切换支付方式
   */
  const setPayType = (payType: 'money' | 'score' | 'combined') => {
    setContext({ payType });
    send(CashierEvent.CHANGE_PAY_TYPE);
  };

  // 自动加载数据
  useEffect(() => {
    if (state === CashierState.IDLE) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // 派生状态
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
