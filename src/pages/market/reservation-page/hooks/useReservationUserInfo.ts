import { useEffect, useState } from 'react'
import { fetchProfile } from '@/services'
import { getStoredToken } from '@/services/client'
import { isSuccess } from '@/utils/apiHelpers'
import { debugLog, warnLog, errorLog } from '@/utils/logger'
import type { ReservationUserInfo } from './reservationPage.types'

interface UseReservationUserInfoResult {
  availableHashrate: number
  accountBalance: number
  userInfoLoading: boolean
}

export function useReservationUserInfo(preloadedUserInfo?: ReservationUserInfo | null): UseReservationUserInfoResult {
  const [availableHashrate, setAvailableHashrate] = useState(preloadedUserInfo?.availableHashrate ?? 0)
  const [accountBalance, setAccountBalance] = useState(preloadedUserInfo?.accountBalance ?? 0)
  const [userInfoLoading, setUserInfoLoading] = useState(true)

  useEffect(() => {
    if (preloadedUserInfo) {
      setAvailableHashrate(preloadedUserInfo.availableHashrate)
      setAccountBalance(preloadedUserInfo.accountBalance)
    }

    if (globalThis.__preloadedReservationData?.userInfo) {
      debugLog('ReservationPage', '使用预加载的用户信息', globalThis.__preloadedReservationData.userInfo)
      setAvailableHashrate(globalThis.__preloadedReservationData.userInfo.availableHashrate)
      setAccountBalance(globalThis.__preloadedReservationData.userInfo.accountBalance)
      if (globalThis.__preloadedReservationData) {
        globalThis.__preloadedReservationData.userInfo = undefined
      }
    }

    const loadUserInfo = async () => {
      setUserInfoLoading(true)
      const token = getStoredToken()
      if (!token) {
        debugLog('ReservationPage', '用户未登录，使用默认算力和余额')
        setUserInfoLoading(false)
        return
      }

      try {
        const response = await fetchProfile(token)
        if (isSuccess(response)) {
          const latestHashrate = Number(response.data.userInfo.green_power) || 0
          const latestBalance = Number(response.data.userInfo.balance_available) || 0
          setAvailableHashrate(latestHashrate)
          setAccountBalance(latestBalance)
          debugLog('ReservationPage', '用户信息已更新', { latestHashrate, latestBalance })
        } else {
          warnLog('ReservationPage', '获取用户信息失败', response.msg || '未知错误')
        }
      } catch (error: any) {
        errorLog('ReservationPage', '获取用户信息失败', error)
      } finally {
        setUserInfoLoading(false)
      }
    }

    void loadUserInfo()
  }, [preloadedUserInfo])

  return {
    availableHashrate,
    accountBalance,
    userInfoLoading,
  }
}
