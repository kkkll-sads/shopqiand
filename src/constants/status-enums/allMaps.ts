import {
  ItemStatusMap,
  ConsignmentStatusMap,
  ConsignmentRecordStatusMap,
  MiningStatusMap,
  DeliveryStatusMap,
} from './collection'
import { OrderStatusMap, ShopOrderStatusMap, PayTypeMap } from './order'
import { MatchingStatusMap, ReservationStatusMap, SessionStatusMap } from './matching'
import { RealNameStatusMap, UserStatusMap } from './user'
import { AccountTypeMap, FlowDirectionMap, BizTypeMap } from './finance'
import { CouponStatusMap, AssetPackageStatusMap, WaiveTypeMap, SettleStatusMap } from './asset'

/**
 * 获取所有映射字典
 */
export function getAllMaps() {
  return {
    item_status: ItemStatusMap,
    consignment_status: ConsignmentStatusMap,
    consignment_record_status: ConsignmentRecordStatusMap,
    mining_status: MiningStatusMap,
    delivery_status: DeliveryStatusMap,
    order_status: OrderStatusMap,
    shop_order_status: ShopOrderStatusMap,
    pay_type: PayTypeMap,
    matching_status: MatchingStatusMap,
    reservation_status: ReservationStatusMap,
    session_status: SessionStatusMap,
    real_name_status: RealNameStatusMap,
    user_status: UserStatusMap,
    account_type: AccountTypeMap,
    flow_direction: FlowDirectionMap,
    biz_type: BizTypeMap,
    coupon_status: CouponStatusMap,
    asset_package_status: AssetPackageStatusMap,
    waive_type: WaiveTypeMap,
    settle_status: SettleStatusMap,
  }
}
