import { useCallback, useEffect, useState } from 'react'
import { fetchAccountOverview, type AccountOverviewData } from '@/services/wallet'
import { getStoredToken } from '@/services/client'
import { extractError, isSuccess } from '@/utils/apiHelpers'
import { useStateMachine } from '@/hooks/useStateMachine'
import { LoadingEvent, LoadingState } from '@/types/states'

interface UseCumulativeRightsOverviewResult {
  loading: boolean
  error: string | null
  data: AccountOverviewData | null
  retry: () => void
}

export function useCumulativeRightsOverview(): UseCumulativeRightsOverviewResult {
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AccountOverviewData | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  })

  useEffect(() => {
    const loadData = async () => {
      const token = getStoredToken()
      if (!token) {
        setError('请先登录')
        loadMachine.send(LoadingEvent.ERROR)
        return
      }

      loadMachine.send(reloadTick === 0 ? LoadingEvent.LOAD : LoadingEvent.RETRY)
      setError(null)

      try {
        const response = await fetchAccountOverview(token)
        if (isSuccess(response) && response.data) {
          setData(response.data)
          loadMachine.send(LoadingEvent.SUCCESS)
          return
        }

        setError(extractError(response, '获取账户信息失败'))
        loadMachine.send(LoadingEvent.ERROR)
      } catch (err: any) {
        setError(err?.message || '获取账户信息失败')
        loadMachine.send(LoadingEvent.ERROR)
      }
    }

    void loadData()
    // reloadTick 变化时触发重试加载。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTick])

  const retry = useCallback(() => {
    setReloadTick((prev) => prev + 1)
  }, [])

  return {
    loading: loadMachine.state === LoadingState.LOADING,
    error,
    data,
    retry,
  }
}
