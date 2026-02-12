import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bidBuy } from '@/services'
import { useNotification } from '@/context/NotificationContext'
import { isSuccess, extractError } from '@/utils/apiHelpers'
import { errorLog } from '@/utils/logger'
import { useAppStore } from '@/stores/appStore'
import { baseHashrate, fallbackProduct, getProductPackageId } from './reservationPage.constants'
import type { UseReservationPageParams, UseReservationPageResult } from './reservationPage.types'
import { useReservationDetailResolver } from './useReservationDetailResolver'
import { useReservationUserInfo } from './useReservationUserInfo'

export function useReservationPage({ product: propProduct, preloadedUserInfo }: UseReservationPageParams): UseReservationPageResult {
  const navigate = useNavigate()
  const { showToast } = useNotification()
  const { selectedProduct } = useAppStore()

  const product = propProduct || selectedProduct || fallbackProduct

  const [extraHashrate, setExtraHashrate] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const { sessionId, zoneId, packageId, zoneMaxPrice, fillSessionZoneFromDetail } = useReservationDetailResolver(product)
  const { availableHashrate, accountBalance, userInfoLoading } = useReservationUserInfo(preloadedUserInfo)

  const frozenAmount = zoneMaxPrice * quantity
  const totalRequiredHashrate = (baseHashrate + extraHashrate) * quantity

  const isHashrateSufficient = availableHashrate >= totalRequiredHashrate
  const isFundSufficient = accountBalance >= frozenAmount

  const maxExtraHashrate = Math.max(0, Math.floor(availableHashrate / quantity) - baseHashrate)
  const canIncreaseHashrate = extraHashrate < maxExtraHashrate

  const handleReservation = useCallback(() => {
    if (!isHashrateSufficient || !isFundSufficient) {
      return
    }
    setShowConfirmModal(true)
  }, [isFundSufficient, isHashrateSufficient])

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

      const finalSessionId = sessionId ?? product.sessionId
      const finalZoneId = zoneId ?? product.zoneId

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

      const response = await bidBuy({
        session_id: ensuredSessionId,
        zone_id: ensuredZoneId,
        package_id: ensuredPackageId,
        extra_hashrate: extraHashrate,
        quantity,
      })

      if (isSuccess(response)) {
        setShowConfirmModal(false)
        showToast('success', '预约成功', response.msg || '预约成功')
        navigate('/reservation-record', { replace: true })
      } else {
        showToast('error', '预约失败', extractError(response, '预约失败'))
      }
    } catch (error: any) {
      errorLog('ReservationPage', '操作失败', error)
      if (error?.name === 'NeedLoginError') return
      showToast('error', '操作失败', error?.msg || error?.message || '网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [extraHashrate, fillSessionZoneFromDetail, navigate, packageId, product, quantity, sessionId, showToast, zoneId])

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
    setQuantity((prev) => Math.min(100, prev + 1))
  }, [])

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
    userInfoLoading,
    loading,
    showConfirmModal,
    canIncreaseHashrate,
    isHashrateSufficient,
    isFundSufficient,
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
