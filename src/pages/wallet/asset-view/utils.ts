import type { MyCollectionItem } from '@/services';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';
import type { AssetFlowFilter, AssetTimeFilter } from './types';

interface TimeRange {
  startTime?: number;
  endTime?: number;
}

export const resolveTimeRange = (filterTime: AssetTimeFilter): TimeRange => {
  const now = Math.floor(Date.now() / 1000);

  switch (filterTime) {
    case 'all':
      return {};
    case 'today': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        startTime: Math.floor(today.getTime() / 1000),
        endTime: now,
      };
    }
    case '7days':
      return { startTime: now - 7 * 24 * 3600, endTime: now };
    case '30days':
      return { startTime: now - 30 * 24 * 3600, endTime: now };
    default:
      return {};
  }
};

export const hasConsignedBefore = (item: MyCollectionItem): boolean => {
  const status = item.consignment_status;
  return typeof status === 'number' && status !== ConsignmentStatus.NOT_CONSIGNED;
};

export const hasConsignedSuccessfully = (item: MyCollectionItem): boolean =>
  item.consignment_status === ConsignmentStatus.SOLD;

export const isConsigning = (item: MyCollectionItem): boolean =>
  item.consignment_status === ConsignmentStatus.CONSIGNING ||
  item.consignment_status === ConsignmentStatus.PENDING;

export const isDelivered = (item: MyCollectionItem): boolean =>
  item.delivery_status === DeliveryStatus.DELIVERED;

export const shouldOpenConsignment = (item: MyCollectionItem): boolean =>
  item.consignment_status === ConsignmentStatus.NOT_CONSIGNED &&
  item.delivery_status !== DeliveryStatus.NOT_DELIVERED;

export const isAssetFlowFilter = (value: unknown): value is AssetFlowFilter =>
  value === 'all' || value === 'in' || value === 'out';

export const isAssetTimeFilter = (value: unknown): value is AssetTimeFilter =>
  value === 'all' || value === 'today' || value === '7days' || value === '30days';
