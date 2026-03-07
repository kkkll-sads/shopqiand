import { Product } from '@/types'
import type {
  CollectionItemDetailData,
  ReservationPaymentSummary,
  ReservationPreviewResult,
} from '@/services'

export interface ReservationUserInfo {
  availableHashrate: number
  accountBalance: number
  pendingActivationGold?: number
  pendingActivationGoldBalance?: number
  pending_activation_gold?: number
  confirm_rights_gold?: number
  [key: string]: unknown
}

export interface PreloadedReservationData {
  userInfo?: ReservationUserInfo
  sessionDetail?: CollectionItemDetailData | null
  zoneMaxPrice?: number
  sessionId?: number | string
  zoneId?: number | string
  packageId?: number | string
  paymentPreview?: ReservationPreviewResult | null
}

export interface ReservationSessionIds {
  sessionId?: number | string
  zoneId?: number | string
  packageId?: number | string
}

declare global {
  interface Window {
    __preloadedReservationData?: PreloadedReservationData | null
  }
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
  pendingActivationGold: number
  userInfoLoading: boolean
  loading: boolean
  showConfirmModal: boolean
  canIncreaseHashrate: boolean
  isHashrateSufficient: boolean
  isFundSufficient: boolean
  paymentSummary: ReservationPaymentSummary
  paymentPreviewLoading: boolean
  paymentPreviewError: string | null
  fundActionText: string
  mixedPaymentAvailable: boolean
  mixedPaymentRemainingTimes: number | null
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
