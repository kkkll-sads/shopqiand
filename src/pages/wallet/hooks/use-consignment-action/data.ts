import {
  fetchConsignmentCoupons,
  getConsignmentCheck,
  type ConsignmentCouponItem,
  type MyCollectionItem,
} from '@/services';
import { extractData } from '@/utils/apiHelpers';
import { debugLog, warnLog } from '@/utils/logger';
import { resolveCollectionId } from './helpers';

interface ConsignmentGateDataResult {
  checkData: any;
  availableCouponCount: number;
}

const COUPON_PAGE_LIMIT = 100;
const COUPON_MAX_PAGES = 20;

/**
 * 拉取全部可用寄售券（自动处理分页）。
 */
export async function fetchAllAvailableConsignmentCoupons(token?: string): Promise<ConsignmentCouponItem[]> {
  const couponMap = new Map<string, ConsignmentCouponItem>();
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= COUPON_MAX_PAGES) {
    const couponRes = await fetchConsignmentCoupons({
      page,
      limit: COUPON_PAGE_LIMIT,
      status: 1,
      token,
    });

    const couponData = couponRes.data;
    const couponList = couponData?.list || [];

    couponList.forEach((coupon, index) => {
      const key =
        coupon?.id !== undefined && coupon?.id !== null
          ? String(coupon.id)
          : `${coupon?.session_id ?? 's'}-${coupon?.zone_id ?? 'z'}-${page}-${index}`;
      if (!couponMap.has(key)) {
        couponMap.set(key, coupon);
      }
    });

    if (couponList.length === 0) {
      hasMore = false;
      break;
    }

    if (typeof couponData?.has_more === 'boolean') {
      hasMore = couponData.has_more;
    } else if (typeof couponData?.total === 'number' && couponData.total > 0) {
      hasMore = couponMap.size < couponData.total;
    } else {
      hasMore = couponList.length >= COUPON_PAGE_LIMIT;
    }

    page += 1;
  }

  if (hasMore && page > COUPON_MAX_PAGES) {
    warnLog('useConsignmentAction', 'Coupon pages exceed safety limit', {
      maxPages: COUPON_MAX_PAGES,
      loadedCoupons: couponMap.size,
    });
  }

  return Array.from(couponMap.values());
}

/**
 * 并行加载寄售解锁校验与寄售券信息
 */
export async function fetchConsignmentGateData(
  item: MyCollectionItem,
  token?: string,
): Promise<ConsignmentGateDataResult | null> {
  const collectionId = resolveCollectionId(item);
  if (collectionId === undefined || collectionId === null) {
    return null;
  }

  const [checkRes, coupons] = await Promise.all([
    getConsignmentCheck({ user_collection_id: collectionId, token }),
    fetchAllAvailableConsignmentCoupons(token),
  ]);

  const checkData = extractData(checkRes) ?? null;
  const itemSessionId = item.session_id || item.original_record?.session_id;
  const itemZoneId = item.zone_id || item.original_record?.zone_id;

  debugLog('useConsignmentAction', 'Coupon matching', {
    totalCoupons: coupons.length,
    itemSessionId,
    itemZoneId,
  });

  if (itemSessionId && itemZoneId) {
    const matched = coupons.filter(
      (coupon) => String(coupon.session_id) === String(itemSessionId) && String(coupon.zone_id) === String(itemZoneId),
    );
    return {
      checkData,
      availableCouponCount: matched.length,
    };
  }

  const fallbackCount = coupons.length;
  warnLog('useConsignmentAction', 'Item missing session/zone info, using fallback', {
    fallbackCount,
  });

  return {
    checkData,
    availableCouponCount: fallbackCount,
  };
}
