import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WithdrawOrderDetail from '../../../pages/wallet/WithdrawOrderDetail';

const WithdrawOrderDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        订单不存在
      </div>
    );
  }

  return <WithdrawOrderDetail orderId={orderId} onBack={() => navigate(-1)} />;
};

export default WithdrawOrderDetailWrapper;
