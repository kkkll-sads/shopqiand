import { useEffect, useState } from 'react'
import { fetchProfile } from '@/services'
import { getStoredToken } from '@/services/client'
import { extractData, isSuccess } from '@/utils/apiHelpers'
import { debugLog, errorLog, warnLog } from '@/utils/logger'
import type { ReservationUserInfo } from './reservationPage.types'

interface UseReservationUserInfoResult {
  availableHashrate: number
  accountBalance: number
  pendingActivationGold: number
  userInfoLoading: boolean
}

const getPendingActivationGold = (userInfo?: ReservationUserInfo | null): number => {
  if (!userInfo) {
    return 0
  }

  return (
    Number(
      userInfo.pendingActivationGold ??
        userInfo.pendingActivationGoldBalance ??
        userInfo.pending_activation_gold ??
        userInfo.confirm_rights_gold,
    ) || 0
  )
}

export function useReservationUserInfo(
  preloadedUserInfo?: ReservationUserInfo | null,
): UseReservationUserInfoResult {
  const [availableHashrate, setAvailableHashrate] = useState(preloadedUserInfo?.availableHashrate ?? 0)
  const [accountBalance, setAccountBalance] = useState(preloadedUserInfo?.accountBalance ?? 0)
  const [pendingActivationGold, setPendingActivationGold] = useState(
    getPendingActivationGold(preloadedUserInfo),
  )
  const [userInfoLoading, setUserInfoLoading] = useState(true)

  useEffect(() => {
    if (preloadedUserInfo) {
      setAvailableHashrate(preloadedUserInfo.availableHashrate)
      setAccountBalance(preloadedUserInfo.accountBalance)
      setPendingActivationGold(getPendingActivationGold(preloadedUserInfo))
    }

    const preloaded = window.__preloadedReservationData
    if (preloaded?.userInfo) {
      debugLog('ReservationPage', 'Use preloaded reservation user info', preloaded.userInfo)
      setAvailableHashrate(preloaded.userInfo.availableHashrate)
      setAccountBalance(preloaded.userInfo.accountBalance)
      setPendingActivationGold(getPendingActivationGold(preloaded.userInfo))
      preloaded.userInfo = undefined
    }

    const loadUserInfo = async () => {
      setUserInfoLoading(true)
      const token = getStoredToken()
      if (!token) {
        debugLog('ReservationPage', 'User not logged in, use default hashrate and funds')
        setUserInfoLoading(false)
        return
      }

      try {
        const response = await fetchProfile(token)
        if (isSuccess(response)) {
          const profileData = extractData(response)
          const latestUserInfo = profileData?.userInfo as unknown as ReservationUserInfo | undefined
          const latestHashrate = Number(profileData?.userInfo?.green_power) || 0
          const latestBalance = Number(profileData?.userInfo?.balance_available) || 0
          const latestPendingActivationGold =
            Number(
              latestUserInfo?.pendingActivationGold ??
                latestUserInfo?.pendingActivationGoldBalance ??
                latestUserInfo?.pending_activation_gold ??
                latestUserInfo?.confirm_rights_gold,
            ) || 0

          setAvailableHashrate(latestHashrate)
          setAccountBalance(latestBalance)
          setPendingActivationGold(latestPendingActivationGold)
          debugLog('ReservationPage', 'Reservation user info refreshed', {
            latestHashrate,
            latestBalance,
            latestPendingActivationGold,
          })
        } else {
          warnLog('ReservationPage', 'Failed to fetch reservation user info', response.msg || 'Unknown error')
        }
      } catch (error: unknown) {
        errorLog('ReservationPage', 'Failed to fetch reservation user info', error)
      } finally {
        setUserInfoLoading(false)
      }
    }

    void loadUserInfo()
  }, [preloadedUserInfo])

  return {
    availableHashrate,
    accountBalance,
    pendingActivationGold,
    userInfoLoading,
  }
}
