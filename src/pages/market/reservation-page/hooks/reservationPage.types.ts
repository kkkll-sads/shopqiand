import { Product } from '@/types'
import type { CollectionItemDetailData } from '@/services'

export interface ReservationUserInfo {
  availableHashrate: number
  accountBalance: number
}

export interface ReservationSessionIds {
  sessionId?: number | string
  zoneId?: number | string
  packageId?: number | string
}

// 全局预加载数据存储
// eslint-disable-next-line no-var
declare global {
  var __preloadedReservationData:
    | {
        userInfo?: ReservationUserInfo
        sessionDetail?: CollectionItemDetailData | null
        zoneMaxPrice?: number
        sessionId?: number | string
        zoneId?: number | string
        packageId?: number | string
      }
    | null
}

export interface UseReservationPageParams {
  product?: Product
  preloadedUserInfo?: ReservationUserInfo | null
}

export interface UseReservationPageResult {
  product: Product
  baseHashrate: number
  extraHashrate: number
  quantity: number
  zoneMaxPrice: number
  frozenAmount: number
  totalRequiredHashrate: number
  availableHashrate: number
  accountBalance: number
  userInfoLoading: boolean
  loading: boolean
  showConfirmModal: boolean
  canIncreaseHashrate: boolean
  isHashrateSufficient: boolean
  isFundSufficient: boolean
  setShowConfirmModal: (value: boolean) => void
  onDecreaseExtraHashrate: () => void
  onIncreaseExtraHashrate: () => void
  onDecreaseQuantity: () => void
  onIncreaseQuantity: () => void
  handleReservation: () => void
  handleRecharge: () => void
  confirmSubmit: () => Promise<void>
}

export interface ReservationDetailResolverResult extends ReservationSessionIds {
  zoneMaxPrice: number
  fillSessionZoneFromDetail: () => Promise<ReservationSessionIds>
}
