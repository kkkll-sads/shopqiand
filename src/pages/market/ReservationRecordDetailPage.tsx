/**
 * ReservationRecordDetailPage - 预约记录详情页面（现代化UI版）
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common';
import ReservationDetailBody from './components/reservation-detail/ReservationDetailBody';
import ReservationDetailErrorState from './components/reservation-detail/ReservationDetailErrorState';
import ReservationDetailHeader from './components/reservation-detail/ReservationDetailHeader';
import { useReservationRecordDetail } from './hooks/useReservationRecordDetail';

const ReservationRecordDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: reservationId } = useParams<{ id: string }>();
  const { record, error, loading } = useReservationRecordDetail(reservationId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <LoadingSpinner text="加载详情..." />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ReservationDetailHeader onBack={() => navigate(-1)} />
        <ReservationDetailErrorState error={error || '记录不存在'} onBack={() => navigate(-1)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ReservationDetailHeader onBack={() => navigate(-1)} />
      <ReservationDetailBody
        record={record}
        onGoCollection={() => {
          navigate('/my-collection');
        }}
      />
    </div>
  );
};

export default ReservationRecordDetailPage;
