import {
  fetchAnnouncements,
  type AnnouncementItem,
  getMyRechargeOrders,
  getMyWithdrawList,
  fetchPendingPayOrders,
  fetchPendingShipOrders,
  fetchPendingConfirmOrders,
  type RechargeOrderItem,
  type WithdrawRecordItem,
  type ShopOrderItem,
} from '@/services';
import { extractData } from '@/utils/apiHelpers';
import { RechargeOrderStatus, WithdrawOrderStatus } from '@/constants/statusEnums';
import { errorLog } from '@/utils/logger';
import { getNewsReadIds } from './storage';
import { messageIconMap, type MessageItem } from './types';

function readList<T>(payload: any): T[] {
  return payload?.data || payload?.list || [];
}

function normalizeUnixTimeToMillis(time: unknown): number {
  if (typeof time === 'number') {
    return time * 1000;
  }

  if (typeof time === 'string') {
    const parsed = parseInt(time, 10);
    if (Number.isFinite(parsed)) {
      return parsed * 1000;
    }
  }

  return Date.now();
}

async function loadAnnouncementMessages(pageNum: number): Promise<MessageItem[]> {
  const messages: MessageItem[] = [];

  try {
    const [announcementRes, dynamicRes] = await Promise.all([
      fetchAnnouncements({ page: pageNum, limit: 10, type: 'normal' }),
      fetchAnnouncements({ page: pageNum, limit: 10, type: 'important' }),
    ]);

    const newsReadIds = getNewsReadIds();

    const announcementData = extractData(announcementRes) as any;
    const announcementList = readList<AnnouncementItem>(announcementData);
    announcementList.forEach((item) => {
      const id = `announcement-${item.id}`;
      messages.push({
        id,
        type: 'notice',
        title: '平台公告',
        content: item.title || '',
        time: item.createtime || '',
        timestamp: item.createtime ? new Date(item.createtime).getTime() : Date.now(),
        isRead: newsReadIds.includes(String(item.id)),
        icon: messageIconMap.AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        sourceId: item.id,
      });
    });

    const dynamicData = extractData(dynamicRes) as any;
    const dynamicList = readList<AnnouncementItem>(dynamicData);
    dynamicList.forEach((item) => {
      const id = `dynamic-${item.id}`;
      messages.push({
        id,
        type: 'activity',
        title: '平台动态',
        content: item.title || '',
        time: item.createtime || '',
        timestamp: item.createtime ? new Date(item.createtime).getTime() : Date.now(),
        isRead: newsReadIds.includes(String(item.id)),
        icon: messageIconMap.Info,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        sourceId: item.id,
      });
    });
  } catch (error) {
    errorLog('MessageCenter', '加载公告失败', error);
  }

  return messages;
}

async function loadRechargeMessages(
  pageNum: number,
  token: string,
  readIds: string[]
): Promise<MessageItem[]> {
  const messages: MessageItem[] = [];

  try {
    const rechargeRes = await getMyRechargeOrders({ page: pageNum, limit: 5, token });
    const rechargeData = extractData(rechargeRes) as any;
    const rechargeList = readList<RechargeOrderItem>(rechargeData);

    rechargeList.forEach((item) => {
      if (
        item.status !== RechargeOrderStatus.PENDING &&
        item.status !== RechargeOrderStatus.APPROVED &&
        item.status !== RechargeOrderStatus.REJECTED
      ) {
        return;
      }

      let content = '';
      if (item.status === RechargeOrderStatus.PENDING) {
        content = `您的充值订单 ${item.order_no} 待审核，金额：¥${item.amount}`;
      } else if (item.status === RechargeOrderStatus.APPROVED) {
        content = `您的充值订单 ${item.order_no} 审核通过，金额：¥${item.amount}`;
      } else if (item.status === RechargeOrderStatus.REJECTED) {
        content = `您的充值订单 ${item.order_no} 审核未通过`;
      }

      const id = `recharge-${item.id}`;
      messages.push({
        id,
        type: 'recharge',
        title: '充值通知',
        content,
        time: item.create_time_text || '',
        timestamp: item.create_time ? item.create_time * 1000 : Date.now(),
        isRead: readIds.includes(id),
        icon: messageIconMap.Wallet,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        sourceId: item.id,
      });
    });
  } catch (error) {
    errorLog('MessageCenter', '加载充值订单失败', error);
  }

  return messages;
}

async function loadWithdrawMessages(
  pageNum: number,
  token: string,
  readIds: string[]
): Promise<MessageItem[]> {
  const messages: MessageItem[] = [];

  try {
    const withdrawRes = await getMyWithdrawList({ page: pageNum, limit: 5, token });
    const withdrawData = extractData(withdrawRes) as any;
    const withdrawList = readList<WithdrawRecordItem>(withdrawData);

    withdrawList.forEach((item) => {
      if (
        item.status !== WithdrawOrderStatus.PENDING &&
        item.status !== WithdrawOrderStatus.APPROVED &&
        item.status !== WithdrawOrderStatus.REJECTED
      ) {
        return;
      }

      let content = '';
      if (item.status === WithdrawOrderStatus.PENDING) {
        content = `您的提现申请待审核，金额：¥${item.amount}`;
      } else if (item.status === WithdrawOrderStatus.APPROVED) {
        content = `您的提现申请已通过，金额：¥${item.amount}，已到账：¥${item.actual_amount}`;
      } else if (item.status === WithdrawOrderStatus.REJECTED) {
        content = `您的提现申请未通过${item.audit_reason ? `：${item.audit_reason}` : ''}`;
      }

      const id = `withdraw-${item.id}`;
      messages.push({
        id,
        type: 'withdraw',
        title: '提现通知',
        content,
        time: item.create_time_text || '',
        timestamp: item.create_time ? item.create_time * 1000 : Date.now(),
        isRead: readIds.includes(id),
        icon: messageIconMap.Receipt,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        sourceId: item.id,
      });
    });
  } catch (error) {
    errorLog('MessageCenter', '加载提现记录失败', error);
  }

  return messages;
}

async function loadShopOrderMessages(
  pageNum: number,
  token: string,
  readIds: string[]
): Promise<MessageItem[]> {
  const messages: MessageItem[] = [];

  try {
    const [pendingPayRes, pendingShipRes, pendingConfirmRes] = await Promise.all([
      fetchPendingPayOrders({ page: pageNum, limit: 3, token }),
      fetchPendingShipOrders({ page: pageNum, limit: 3, token }),
      fetchPendingConfirmOrders({ page: pageNum, limit: 3, token }),
    ]);

    const pendingPayData = extractData(pendingPayRes);
    pendingPayData?.list?.forEach((item: ShopOrderItem) => {
      const id = `shop-order-pay-${item.id}`;
      messages.push({
        id,
        type: 'shop_order',
        title: '订单提醒',
        content: `您有订单 ${item.order_no || item.id} 待付款，请及时支付`,
        time: item.create_time_text || '',
        timestamp: normalizeUnixTimeToMillis((item as any).create_time),
        isRead: readIds.includes(id),
        icon: messageIconMap.Package,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        sourceId: item.id,
      });
    });

    const pendingShipData = extractData(pendingShipRes);
    pendingShipData?.list?.forEach((item: ShopOrderItem) => {
      const id = `shop-order-ship-${item.id}`;
      messages.push({
        id,
        type: 'shop_order',
        title: '订单通知',
        content: `您的订单 ${item.order_no || item.id} 已付款，等待商家发货`,
        time: item.pay_time_text || item.create_time_text || '',
        timestamp: normalizeUnixTimeToMillis((item as any).pay_time),
        isRead: readIds.includes(id),
        icon: messageIconMap.CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        sourceId: item.id,
      });
    });

    const pendingConfirmData = extractData(pendingConfirmRes);
    pendingConfirmData?.list?.forEach((item: ShopOrderItem) => {
      const id = `shop-order-confirm-${item.id}`;
      messages.push({
        id,
        type: 'shop_order',
        title: '订单通知',
        content: `您的订单 ${item.order_no || item.id} 已发货${(item as any).shipping_no ? `，物流单号：${(item as any).shipping_no}` : ''}，请及时确认收货`,
        time: item.ship_time_text || item.create_time_text || '',
        timestamp: normalizeUnixTimeToMillis((item as any).ship_time),
        isRead: readIds.includes(id),
        icon: messageIconMap.Truck,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        sourceId: item.id,
      });
    });
  } catch (error) {
    errorLog('MessageCenter', '加载商城订单失败', error);
  }

  return messages;
}

export async function loadMessagesBatch(params: {
  pageNum: number;
  token: string;
  readIds: string[];
}): Promise<MessageItem[]> {
  const [announcementMessages, rechargeMessages, withdrawMessages, shopOrderMessages] =
    await Promise.all([
      loadAnnouncementMessages(params.pageNum),
      loadRechargeMessages(params.pageNum, params.token, params.readIds),
      loadWithdrawMessages(params.pageNum, params.token, params.readIds),
      loadShopOrderMessages(params.pageNum, params.token, params.readIds),
    ]);

  const allMessages = [
    ...announcementMessages,
    ...rechargeMessages,
    ...withdrawMessages,
    ...shopOrderMessages,
  ];

  allMessages.sort((a, b) => b.timestamp - a.timestamp);
  return allMessages;
}
