/**
 * useProductBuy - 商品购买逻辑 Hook
 * 
 * 购买流程：
 * 1. createOrder - 创建订单（返回待支付订单）
 * 2. 跳转收银台 - 用户确认支付
 * 3. payShopOrder - 完成支付
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState } from '@/types/states';

interface UseProductBuyParams {
  productId: string | number;
  productTitle: string;
  isPhysical?: boolean;  // 是否为实物商品（传入可避免额外请求）
}

export function useProductBuy({ productId, productTitle, isPhysical }: UseProductBuyParams) {
  const navigate = useNavigate();
  const { showToast, showDialog } = useNotification();
  const { handleError: handleBuyError } = useErrorHandler({ showToast: true, persist: false });

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [selectedSkuId, setSelectedSkuId] = useState<number | undefined>(undefined);

  const buyMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });

  const buying = buyMachine.state === FormState.SUBMITTING;

  const handleConfirmBuy = useCallback(async (quantity: number, specs?: Record<string, string>, skuId?: number) => {
    if (buying) return;

    setBuyQuantity(quantity);
    if (specs) {
      setSelectedSpecs(specs);
    }
    if (skuId) {
      setSelectedSkuId(skuId);
    }

    const specText = specs && Object.keys(specs).length > 0
      ? ` (${Object.values(specs).join('、')})`
      : '';

    showDialog({
      title: '确认购买',
      description: `确定要购买 ${quantity} 件 ${productTitle}${specText} 吗？`,
      confirmText: '立即支付',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          buyMachine.send(FormEvent.SUBMIT);
          const orderItem: { product_id: number; quantity: number; sku_id?: number } = {
            product_id: Number(productId),
            quantity,
          };
          if (skuId) {
            orderItem.sku_id = skuId;
          }
          
          // 第一步：创建订单（/api/shopOrder/create）
          const response = await createOrder({
            items: [orderItem],
            pay_type: 'score', // 支付方式由系统自动计算
            is_physical: isPhysical, // 传入是否实物商品，避免额外请求
          });

          if (isSuccess(response)) {
            const data = response.data as any;
            // createOrder 返回: order_no, order_id, total_amount, total_score, status, pay_type
            const orderId = data?.order_id || data?.id;

            if (orderId) {
              // 第二步：跳转收银台，用户确认后调用 /api/shopOrder/pay 完成支付
              navigate(`/cashier/${orderId}`);
            } else {
              showToast('success', '订单创建成功');
              setTimeout(() => navigate('/orders/points/0'), 1500);
            }
            buyMachine.send(FormEvent.SUBMIT_SUCCESS);
          } else {
            handleBuyError(response, {
              toastTitle: '订单创建失败',
              customMessage: response.msg || '订单创建失败',
              context: { productId }
            });
            buyMachine.send(FormEvent.SUBMIT_ERROR);
          }
        } catch (err: any) {
          handleBuyError(err, {
            toastTitle: '订单创建失败',
            customMessage: err.message || '系统错误',
            context: { productId }
          });
          buyMachine.send(FormEvent.SUBMIT_ERROR);
        }
      }
    });
  }, [productId, productTitle, isPhysical, buying, buyMachine, showDialog, showToast, handleBuyError, navigate]);

  return {
    selectedSpecs,
    buyQuantity,
    selectedSkuId,
    buying,
    handleConfirmBuy,
    setBuyQuantity,
    setSelectedSpecs,
    setSelectedSkuId,
  };
}
