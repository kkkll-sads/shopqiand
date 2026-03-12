import type { MessageItem } from '../api/modules/message';
import { getBillingPath } from './billing';
import { resolveLegacyAppPath } from './navigation';

const MESSAGE_SCENE_LABELS: Record<string, string> = {
  announcement: '公告',
  approved: '已通过',
  dynamic: '动态',
  failed: '处理失败',
  paid: '已到账',
  pending_confirm: '待收货',
  pending_pay: '待支付',
  pending_payment: '待支付',
  pending_review: '审核中',
  pending_ship: '待发货',
  rejected: '已驳回',
};

const MESSAGE_TYPE_TITLES: Record<MessageItem['type'], string> = {
  system: '系统通知',
  order: '订单通知',
  activity: '活动通知',
  notice: '平台公告',
  recharge: '充值通知',
  withdraw: '提现通知',
  shop_order: '订单进度',
};

function normalizeActionPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
}

function resolveActionPath(path: string, message: MessageItem): string | null {
  const normalized = normalizeActionPath(path);
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const legacyPath = resolveLegacyAppPath(normalized);
  if (legacyPath) {
    return legacyPath;
  }

  const orderMatch = normalized.match(/^\/order\/(\d+)(?:[/?#].*)?$/);
  if (orderMatch) {
    return `/order/detail/${orderMatch[1]}`;
  }

  if (/^\/recharge-order\/\d+(?:[/?#].*)?$/i.test(normalized)) {
    return message.scene === 'pending_payment' ? '/recharge' : getBillingPath('recharge');
  }

  if (/^\/withdraw-order\/\d+(?:[/?#].*)?$/i.test(normalized)) {
    return getBillingPath('withdraw');
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  return `/${normalized.replace(/^\/+/, '')}`;
}

export function resolveMessageTitle(message: MessageItem): string {
  const title = message.title.trim();
  if (title) {
    return title;
  }

  if (message.sourceType === 'announcement' && message.content) {
    return message.content;
  }

  return MESSAGE_TYPE_TITLES[message.type] ?? '消息通知';
}

export function resolveMessageSceneLabel(message: MessageItem): string {
  if (message.scene && MESSAGE_SCENE_LABELS[message.scene]) {
    return MESSAGE_SCENE_LABELS[message.scene];
  }

  if (message.category === 'finance') {
    return '资金';
  }

  if (message.category === 'activity') {
    return '活动';
  }

  if (message.category === 'order') {
    return '订单';
  }

  return '系统';
}

export function resolveMessageTargetPath(message: MessageItem): string | null {
  const actionPath = resolveActionPath(message.actionPath, message);
  if (actionPath) {
    return actionPath;
  }

  if (message.sourceType === 'announcement' || message.bizType === 'announcement') {
    return message.sourceId > 0 ? `/announcement/${message.sourceId}` : '/announcement';
  }

  if (message.sourceType === 'shop_order' || message.bizType === 'shop_order') {
    return message.sourceId > 0 ? `/order/detail/${message.sourceId}` : '/order';
  }

  if (message.sourceType === 'recharge_order' || message.bizType === 'recharge_order') {
    return message.scene === 'pending_payment' ? '/recharge' : getBillingPath('recharge');
  }

  if (message.sourceType === 'user_withdraw' || message.bizType === 'user_withdraw') {
    return getBillingPath('withdraw');
  }

  return null;
}

export function getMessageDetailPath(messageKey: string) {
  return `/messages/detail/${encodeURIComponent(messageKey)}`;
}

export function resolveMessageActionText(message: MessageItem): string | null {
  if (message.sourceType === 'announcement' || message.bizType === 'announcement') {
    return '查看公告';
  }

  if (message.sourceType === 'shop_order' || message.bizType === 'shop_order') {
    return '查看订单';
  }

  if (message.sourceType === 'recharge_order' || message.bizType === 'recharge_order') {
    return '查看充值记录';
  }

  if (message.sourceType === 'user_withdraw' || message.bizType === 'user_withdraw') {
    return '查看提现记录';
  }

  if (message.actionPath.trim()) {
    return '前往相关页面';
  }

  return null;
}
