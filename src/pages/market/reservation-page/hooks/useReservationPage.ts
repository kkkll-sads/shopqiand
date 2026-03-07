import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  bidBuy,
  buildEstimatedReservationPaymentSummary,
  fetchReservationPreview,
  normalizeReservationPaymentSummary,
} from '@/services'
import { useNotification } from '@/context/NotificationContext'
import { extractData, extractError, extractErrorFromException, isSuccess } from '@/utils/apiHelpers'
import { errorLog } from '@/utils/logger'
import { useAppStore } from '@/stores/appStore'
import { baseHashrate, fallbackProduct, getProductPackageId } from './reservationPage.constants'
import type { UseReservationPageParams, UseReservationPageResult } from './reservationPage.types'
import { useReservationDetailResolver } from './useReservationDetailResolver'
import { useReservationUserInfo } from './useReservationUserInfo'

const FREEZE_PREVIEW_ERROR = '获取冻结结构失败'
const RESERVATION_SUCCESS = '预约成功'
const RESERVATION_FAILURE = '预约失败'
const ACTION_FAILURE = '操作失败'
const NETWORK_RETRY_MESSAGE = '网络错误，请稍后重试'
const FUND_RECHARGE_TEXT = '前往充值专项金'
const FUND_TOP_UP_TEXT = '前往补足资金'
const PREVIEW_LOG_MESSAGE = '获取预约预览失败'

export function useReservationPage({
  product: propProduct,
  preloadedUserInfo,
}: UseReservationPageParams): UseReservationPageResult {
  const navigate = useNavigate()
  const { showToast } = useNotification()
  const { selectedProduct } = useAppStore()

  const product = propProduct || selectedProduct || fallbackProduct

  const [extraHashrate, setExtraHashrate] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentPreviewLoading, setPaymentPreviewLoading] = useState(false)
  const [paymentPreviewError, setPaymentPreviewError] = useState<string | null>(null)
  const [mixedPaymentRemainingTimes, setMixedPaymentRemainingTimes] = useState<number | null>(null)

  const previewRequestIdRef = useRef(0)

  const { sessionId, zoneId, packageId, zoneMaxPrice, fillSessionZoneFromDetail } =
    useReservationDetailResolver(product)
  const { availableHashrate, accountBalance, pendingActivationGold, userInfoLoading } =
    useReservationUserInfo(preloadedUserInfo)

  const frozenAmount = zoneMaxPrice * quantity
  const totalRequiredHashrate = (baseHashrate + extraHashrate) * quantity

  const buildPaymentSummaryFallbacks = useCallback(
    (freezeAmount = frozenAmount) => ({
      freezeAmount,
      specialFundBalance: accountBalance,
      pendingActivationGoldBalance: pendingActivationGold,
    }),
    [accountBalance, frozenAmount, pendingActivationGold],
  )

  const [paymentSummary, setPaymentSummary] = useState(() =>
    buildEstimatedReservationPaymentSummary(buildPaymentSummaryFallbacks()),
  )

  const isHashrateSufficient = availableHashrate >= totalRequiredHashrate
  const isFundSufficient = paymentSummary.canPay

  const maxExtraHashrate = Math.max(0, Math.floor(availableHashrate / quantity) - baseHashrate)
  const canIncreaseHashrate = extraHashrate < maxExtraHashrate

  const ensureReservationIds = useCallback(async () => {
    const finalSessionId = sessionId ?? product.sessionId ?? product.session_id
    const finalZoneId = zoneId ?? product.zoneId ?? product.zone_id

    let ensuredSessionId = finalSessionId
    let ensuredZoneId = finalZoneId
    let ensuredPackageId = packageId ?? getProductPackageId(product)

    if (
      !ensuredSessionId ||
      Number(ensuredSessionId) <= 0 ||
      !ensuredZoneId ||
      Number(ensuredZoneId) <= 0 ||
      !ensuredPackageId
    ) {
      const filled = await fillSessionZoneFromDetail()
      ensuredSessionId = filled.sessionId
      ensuredZoneId = filled.zoneId
      if (filled.packageId) ensuredPackageId = filled.packageId
    }

    return {
      sessionId: ensuredSessionId,
      zoneId: ensuredZoneId,
      packageId: ensuredPackageId,
    }
  }, [fillSessionZoneFromDetail, packageId, product, sessionId, zoneId])

  useEffect(() => {
    let cancelled = false
    const requestId = previewRequestIdRef.current + 1
    previewRequestIdRef.current = requestId

    const fallbackSummary = buildEstimatedReservationPaymentSummary(buildPaymentSummaryFallbacks())

    setPaymentSummary(fallbackSummary)
    setPaymentPreviewLoading(true)
    setPaymentPreviewError(null)

    const timer = setTimeout(async () => {
      try {
        const ensured = await ensureReservationIds()
        if (cancelled || requestId !== previewRequestIdRef.current) return

        // 关键 ID 缺失时直接使用兜底数据，避免抛出异常
        if (
          !ensured.sessionId ||
          !ensured.zoneId ||
          !ensured.packageId ||
          Number(ensured.sessionId) <= 0 ||
          Number(ensured.zoneId) <= 0
        ) {
          setPaymentSummary(fallbackSummary)
          setPaymentPreviewLoading(false)
          return
        }

        const response = await fetchReservationPreview({
          session_id: ensured.sessionId,
          zone_id: ensured.zoneId,
          package_id: ensured.packageId,
          extra_hashrate: extraHashrate,
          quantity,
        })

        if (cancelled || requestId !== previewRequestIdRef.current) return

        if (isSuccess(response)) {
          const previewData = extractData(response)
          setPaymentSummary(
            normalizeReservationPaymentSummary(
              previewData ?? {},
              buildPaymentSummaryFallbacks(frozenAmount),
            ),
          )
          setPaymentPreviewError(null)

          const mixedInfo = previewData?.mixed_payment_info as Record<string, unknown> | undefined
          const remaining =
            Number(previewData?.mixed_payment_remaining_times) ||
            Number(mixedInfo?.remaining_times) ||
            null
          setMixedPaymentRemainingTimes(remaining)
        } else {
          setPaymentSummary(fallbackSummary)
          setPaymentPreviewError(extractError(response, FREEZE_PREVIEW_ERROR))
        }
      } catch (error: unknown) {
        if (cancelled || requestId !== previewRequestIdRef.current) return

        if (!(error instanceof Error && error.name === 'NeedLoginError')) {
          errorLog('ReservationPage', PREVIEW_LOG_MESSAGE, error)
          setPaymentPreviewError(extractErrorFromException(error, FREEZE_PREVIEW_ERROR))
        }
        setPaymentSummary(fallbackSummary)
      } finally {
        if (!cancelled && requestId === previewRequestIdRef.current) {
          setPaymentPreviewLoading(false)
        }
      }
    }, 150)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    buildPaymentSummaryFallbacks,
    ensureReservationIds,
    extraHashrate,
    frozenAmount,
    quantity,
  ])

  const handleReservation = useCallback(() => {
    if (paymentPreviewLoading || !isHashrateSufficient || !isFundSufficient) {
      return
    }
    setShowConfirmModal(true)
  }, [isFundSufficient, isHashrateSufficient, paymentPreviewLoading])

  const handleRecharge = useCallback(() => {
    if (!isHashrateSufficient) {
      navigate('/hashrate-exchange')
      return
    }

    if (!isFundSufficient) {
      navigate('/balance-recharge')
    }
  }, [isFundSufficient, isHashrateSufficient, navigate])

  const confirmSubmit = useCallback(async () => {
    try {
      setLoading(true)

      const ensured = await ensureReservationIds()

      const response = await bidBuy({
        session_id: ensured.sessionId,
        zone_id: ensured.zoneId,
        package_id: ensured.packageId,
        extra_hashrate: extraHashrate,
        quantity,
      })

      if (isSuccess(response)) {
        const responseData = extractData(response) ?? response.data ?? {}
        const submittedFreezeAmount = Number(responseData?.freeze_amount) || frozenAmount
        const submittedPaymentSummary = normalizeReservationPaymentSummary(
          responseData,
          buildPaymentSummaryFallbacks(submittedFreezeAmount),
        )

        setShowConfirmModal(false)
        showToast('success', RESERVATION_SUCCESS, response.msg || RESERVATION_SUCCESS)
        navigate('/reservation-record', {
          replace: true,
          state: {
            latestReservationSubmission: {
              ...submittedPaymentSummary,
              reservationId: responseData?.reservation_id,
              zoneName: responseData?.zone_name,
              packageName: responseData?.package_name,
              quantity,
              totalRequiredHashrate,
              submittedAt: Date.now(),
            },
          },
        })
      } else {
        showToast('error', RESERVATION_FAILURE, extractError(response, RESERVATION_FAILURE))
      }
    } catch (error: unknown) {
      errorLog('ReservationPage', ACTION_FAILURE, error)
      if (error instanceof Error && error.name === 'NeedLoginError') return
      showToast('error', ACTION_FAILURE, extractErrorFromException(error, NETWORK_RETRY_MESSAGE))
    } finally {
      setLoading(false)
    }
  }, [
    buildPaymentSummaryFallbacks,
    ensureReservationIds,
    extraHashrate,
    frozenAmount,
    navigate,
    quantity,
    showToast,
    totalRequiredHashrate,
  ])

  const onDecreaseExtraHashrate = useCallback(() => {
    setExtraHashrate((prev) => Math.max(0, prev - 1))
  }, [])

  const onIncreaseExtraHashrate = useCallback(() => {
    if (canIncreaseHashrate) {
      setExtraHashrate((prev) => prev + 1)
    }
  }, [canIncreaseHashrate])

  const onDecreaseQuantity = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }, [])

  const onIncreaseQuantity = useCallback(() => {
    const maxByMixed = mixedPaymentRemainingTimes ?? 100
    if (quantity >= maxByMixed) {
      showToast('warning', '超出限制', `混合支付剩余可用次数为 ${maxByMixed} 次`)
      return
    }
    setQuantity((prev) => Math.min(Math.min(100, maxByMixed), prev + 1))
  }, [mixedPaymentRemainingTimes, quantity, showToast])

  const fundActionText =
    !isFundSufficient && (paymentSummary.isMixedPayment || pendingActivationGold > 0)
      ? FUND_TOP_UP_TEXT
      : FUND_RECHARGE_TEXT

  const mixedPaymentAvailable = mixedPaymentRemainingTimes !== null && mixedPaymentRemainingTimes > 0

  return {
    product,
    baseHashrate,
    extraHashrate,
    quantity,
    zoneMaxPrice,
    frozenAmount,
    totalRequiredHashrate,
    availableHashrate,
    accountBalance,
    pendingActivationGold,
    userInfoLoading,
    loading,
    showConfirmModal,
    canIncreaseHashrate,
    isHashrateSufficient,
    isFundSufficient,
    paymentSummary,
    paymentPreviewLoading,
    paymentPreviewError,
    fundActionText,
    mixedPaymentAvailable,
    mixedPaymentRemainingTimes,
    setShowConfirmModal,
    onDecreaseExtraHashrate,
    onIncreaseExtraHashrate,
    onDecreaseQuantity,
    onIncreaseQuantity,
    handleReservation,
    handleRecharge,
    confirmSubmit,
  }
}
