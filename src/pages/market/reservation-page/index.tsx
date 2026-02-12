/**
 * ReservationPage - 预约页面
 * 已迁移: 使用 React Router 导航
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Product } from '@/types'
import ReservationProductCard from './components/ReservationProductCard'
import ReservationPurchaseConfigCard from './components/ReservationPurchaseConfigCard'
import ReservationFundCard from './components/ReservationFundCard'
import ReservationFooterAction from './components/ReservationFooterAction'
import ReservationConfirmModal from './components/ReservationConfirmModal'
import { useReservationPage } from './hooks/useReservationPage'

interface ReservationPageProps {
  product?: Product
  preloadedUserInfo?: { availableHashrate: number; accountBalance: number } | null
}

const ReservationPage: React.FC<ReservationPageProps> = ({ product: propProduct, preloadedUserInfo }) => {
  const navigate = useNavigate()

  const {
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
  } = useReservationPage({ product: propProduct, preloadedUserInfo })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 flex items-center justify-between text-white shadow-lg">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-white/20 transition-all">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">预约确权</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-4 space-y-4">
        <ReservationProductCard product={product} />

        <ReservationPurchaseConfigCard
          baseHashrate={baseHashrate}
          extraHashrate={extraHashrate}
          canIncreaseHashrate={canIncreaseHashrate}
          quantity={quantity}
          zoneMaxPrice={zoneMaxPrice}
          frozenAmount={frozenAmount}
          totalRequiredHashrate={totalRequiredHashrate}
          userInfoLoading={userInfoLoading}
          availableHashrate={availableHashrate}
          isHashrateSufficient={isHashrateSufficient}
          onDecreaseExtraHashrate={onDecreaseExtraHashrate}
          onIncreaseExtraHashrate={onIncreaseExtraHashrate}
          onDecreaseQuantity={onDecreaseQuantity}
          onIncreaseQuantity={onIncreaseQuantity}
        />

        <ReservationFundCard
          userInfoLoading={userInfoLoading}
          frozenAmount={frozenAmount}
          accountBalance={accountBalance}
          isFundSufficient={isFundSufficient}
        />
      </div>

      <ReservationFooterAction
        userInfoLoading={userInfoLoading}
        isHashrateSufficient={isHashrateSufficient}
        isFundSufficient={isFundSufficient}
        onClick={!isHashrateSufficient || !isFundSufficient ? handleRecharge : handleReservation}
      />

      <ReservationConfirmModal
        visible={showConfirmModal}
        loading={loading}
        baseHashrate={baseHashrate}
        extraHashrate={extraHashrate}
        totalRequiredHashrate={totalRequiredHashrate}
        quantity={quantity}
        frozenAmount={frozenAmount}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
      />
    </div>
  )
}

export default ReservationPage
