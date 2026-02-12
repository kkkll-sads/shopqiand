import type { MyCollectionItem } from '@/services';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';

/**
 * 解析藏品 ID
 */
export function resolveCollectionId(item: MyCollectionItem | null | undefined): number | string | undefined {
  if (!item) return undefined;
  return (
    item.user_collection_id ??
    (item.original_record ? item.original_record.user_collection_id : undefined) ??
    (item.original_record ? item.original_record.order_id : undefined) ??
    (item.original_record ? item.original_record.id : undefined) ??
    item.id ??
    item.item_id
  );
}

/**
 * 检查是否满足48小时
 */
export function check48Hours(
  buyTime: number | string | null | undefined,
): { passed: boolean; hoursLeft: number; hasValidBuyTime: boolean } {
  const rawTime = Number(buyTime);
  const now = Math.floor(Date.now() / 1000);
  const normalizedBuyTime = Number.isFinite(rawTime) && rawTime > 1e12 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);

  if (!Number.isFinite(normalizedBuyTime) || normalizedBuyTime <= 0 || normalizedBuyTime > now) {
    return {
      passed: false,
      hoursLeft: 48,
      hasValidBuyTime: false,
    };
  }

  const hoursPassed = (now - normalizedBuyTime) / 3600;
  const hoursLeft = 48 - hoursPassed;
  return {
    passed: hoursPassed >= 48,
    hoursLeft: Math.max(0, Math.ceil(hoursLeft)),
    hasValidBuyTime: true,
  };
}

/**
 * 检查是否曾经寄售过
 */
export function hasConsignedBefore(item: MyCollectionItem): boolean {
  const status = item.consignment_status;
  return typeof status === 'number' && status !== ConsignmentStatus.NOT_CONSIGNED;
}

/**
 * 检查是否已经寄售成功（已售出）
 */
export function hasConsignedSuccessfully(item: MyCollectionItem): boolean {
  return item.consignment_status === ConsignmentStatus.SOLD;
}

/**
 * 检查是否正在寄售中
 */
export function isConsigning(item: MyCollectionItem): boolean {
  return item.consignment_status === ConsignmentStatus.CONSIGNING;
}

/**
 * 检查是否已提货
 */
export function isDelivered(item: MyCollectionItem): boolean {
  return item.delivery_status === DeliveryStatus.DELIVERED;
}

/**
 * 格式化秒数为时分秒
 */
export function formatSeconds(secs: number): string {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 从寄售检查数据中提取剩余秒数
 */
export function getRemainingSeconds(checkData: any): number | null {
  if (!checkData) return null;

  if (typeof checkData.remaining_seconds !== 'undefined' && checkData.remaining_seconds !== null) {
    return Number(checkData.remaining_seconds) || 0;
  }

  if (typeof checkData.remaining_text === 'string') {
    const match = checkData.remaining_text.match(/(\d{1,}):(\d{2}):(\d{2})/);
    if (match) {
      const h = Number(match[1]) || 0;
      const m = Number(match[2]) || 0;
      const s = Number(match[3]) || 0;
      return h * 3600 + m * 60 + s;
    }
  }

  return null;
}

interface CanPerformConsignmentParams {
  item: MyCollectionItem | null;
  availableCouponCount: number;
  checkingCoupons: boolean;
  consignmentCheckData: any;
  consignmentRemaining: number | null;
}

/**
 * 检查是否可执行寄售
 */
export function canPerformConsignmentForItem(params: CanPerformConsignmentParams): boolean {
  const { item, availableCouponCount, checkingCoupons, consignmentCheckData, consignmentRemaining } = params;
  if (!item) return false;

  if (isConsigning(item) || hasConsignedSuccessfully(item)) {
    return false;
  }

  const collectionId = resolveCollectionId(item);
  if (collectionId === undefined || collectionId === null) {
    return false;
  }

  const timeCheck = check48Hours(item.pay_time || item.buy_time || 0);
  const hasTicket = availableCouponCount > 0;

  if (consignmentCheckData) {
    let unlocked = false;
    if (typeof consignmentCheckData.can_consign === 'boolean') {
      unlocked = consignmentCheckData.can_consign;
    } else if (typeof consignmentCheckData.unlocked === 'boolean') {
      unlocked = consignmentCheckData.unlocked;
    } else if (typeof consignmentCheckData.remaining_seconds === 'number') {
      unlocked = Number(consignmentCheckData.remaining_seconds) <= 0;
    } else if (typeof consignmentRemaining === 'number') {
      unlocked = consignmentRemaining <= 0;
    } else {
      unlocked = timeCheck.passed;
    }

    if (checkingCoupons) return false;
    return unlocked && hasTicket;
  }

  if (checkingCoupons) return false;
  return timeCheck.passed && hasTicket;
}
