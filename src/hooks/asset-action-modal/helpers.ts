import type { MyCollectionItem } from '@/services';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';
import type { ConsignmentCheckResult, DeliveryCheckResult } from './types';

export const check48Hours = (
  time: number | string | null | undefined,
): { passed: boolean; hoursLeft: number; hasValidBuyTime: boolean } => {
  const rawTime = Number(time);
  const now = Math.floor(Date.now() / 1000);
  const normalizedTime = Number.isFinite(rawTime) && rawTime > 1e12 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);

  if (!Number.isFinite(normalizedTime) || normalizedTime <= 0 || normalizedTime > now) {
    return { passed: false, hoursLeft: 48, hasValidBuyTime: false };
  }

  const hoursPassed = (now - normalizedTime) / 3600;
  const hoursLeft = 48 - hoursPassed;
  return {
    passed: hoursPassed >= 48,
    hoursLeft: Math.max(0, Math.ceil(hoursLeft)),
    hasValidBuyTime: true,
  };
};

export const checkItemStatus = (item: MyCollectionItem) => {
  return {
    isConsigning:
      item.consignment_status === ConsignmentStatus.CONSIGNING ||
      item.consignment_status === ConsignmentStatus.PENDING,
    hasConsignedBefore:
      typeof item.consignment_status === 'number' &&
      item.consignment_status !== ConsignmentStatus.NOT_CONSIGNED,
    hasConsignedSuccessfully: item.consignment_status === ConsignmentStatus.SOLD,
    isDelivered: item.delivery_status === DeliveryStatus.DELIVERED,
  };
};

export const resolveCollectionId = (item: MyCollectionItem): number | string | undefined => {
  return item.user_collection_id || item.id;
};

export const buildDeliveryCheckResult = (item: MyCollectionItem): DeliveryCheckResult => {
  const itemStatus = checkItemStatus(item);
  const timeCheck = check48Hours(item.pay_time || item.buy_time || 0);

  return {
    ...itemStatus,
    can48Hours: timeCheck.passed,
    hoursLeft: timeCheck.hoursLeft,
  };
};

export const buildConsignmentCheckResult = (
  data: any,
  consignmentTicketCount: number
): ConsignmentCheckResult => {
  let unlocked = false;
  let remainingSeconds: number | null = null;
  let remainingText: string | null = null;

  if (typeof data.can_consign === 'boolean') {
    unlocked = data.can_consign;
  } else if (typeof data.unlocked === 'boolean') {
    unlocked = data.unlocked;
  } else if (typeof data.remaining_seconds === 'number') {
    unlocked = Number(data.remaining_seconds) <= 0;
    remainingSeconds = Number(data.remaining_seconds);
  }

  if (typeof data.remaining_text === 'string') {
    remainingText = data.remaining_text;
    const match = data.remaining_text.match(/(\d{1,}):(\d{2}):(\d{2})/);
    if (match) {
      const h = Number(match[1]) || 0;
      const m = Number(match[2]) || 0;
      const s = Number(match[3]) || 0;
      remainingSeconds = h * 3600 + m * 60 + s;
    }
  } else if (typeof data.remaining_seconds === 'number') {
    remainingSeconds = Number(data.remaining_seconds);
  }

  return {
    unlocked,
    remainingSeconds,
    remainingText,
    canConsign: unlocked && consignmentTicketCount > 0,
  };
};

export const calculateCountdown = (secs: number) => {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  return { hours, minutes, seconds };
};
