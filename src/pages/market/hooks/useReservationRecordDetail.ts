import { useEffect, useState } from 'react';
import { fetchReservationDetail, type ReservationDetailData } from '@/services/collection/trade';
import { extractData, isSuccess } from '@/utils/apiHelpers';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';

interface UseReservationRecordDetailResult {
  record: ReservationDetailData | null;
  error: string | null;
  loading: boolean;
}

export function useReservationRecordDetail(
  reservationId?: string,
): UseReservationRecordDetailResult {
  const [record, setRecord] = useState<ReservationDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  });

  const loading = loadMachine.state === LoadingState.LOADING;

  useEffect(() => {
    const loadDetail = async () => {
      try {
        loadMachine.send(LoadingEvent.LOAD);
        setError(null);

        const response = await fetchReservationDetail(reservationId);
        if (isSuccess(response)) {
          setRecord(extractData(response));
          loadMachine.send(LoadingEvent.SUCCESS);
        } else {
          setError(response.msg || '加载失败');
          loadMachine.send(LoadingEvent.ERROR);
        }
      } catch (error) {
        errorLog('ReservationRecordDetailPage', '加载预约详情失败', error);
        setError('加载失败，请稍后重试');
        loadMachine.send(LoadingEvent.ERROR);
      }
    };

    void loadDetail();
  }, [reservationId]);

  return {
    record,
    error,
    loading,
  };
}
