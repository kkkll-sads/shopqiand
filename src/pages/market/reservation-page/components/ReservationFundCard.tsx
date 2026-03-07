import React from 'react'
import { AlertCircle, Info, Wallet } from 'lucide-react'

interface ReservationFundCardProps {
  userInfoLoading: boolean
  frozenAmount: number
  accountBalance: number
  pendingActivationGold: number
  isFundSufficient: boolean
}

const TEXT = {
  title: '资金冻结',
  totalFreeze: '需冻结总额（该场次最高价）',
  specialFundBalance: '当前专项金余额',
  pendingActivationGoldBalance: '当前待激活确权金余额',
  loading: '加载中...',
  freezeTip:
    '预约时将冻结该场次最高金额，撮合成功后若实际藏品价格低于冻结金额，将自动退还差价。',
  insufficient: '当前可用资金不足，无法完成本次冻结。',
  pendingActivationGold: '待激活确权金',
} as const

const ReservationFundCard: React.FC<ReservationFundCardProps> = ({
  userInfoLoading,
  frozenAmount,
  accountBalance,
  pendingActivationGold,
  isFundSufficient,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50">
          <Wallet size={18} className="fill-blue-600 text-blue-600" />
        </div>
        <span>{TEXT.title}</span>
      </h3>

      <div className="mb-3 flex justify-between text-sm text-gray-600">
        <span>{TEXT.totalFreeze}</span>
        <span className="font-mono font-bold text-red-600">¥{frozenAmount.toLocaleString()}</span>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
          <span className="text-sm text-gray-500">{TEXT.specialFundBalance}</span>
          {userInfoLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
              <span className="text-sm text-gray-500">{TEXT.loading}</span>
            </div>
          ) : (
            <span className={`font-mono font-bold ${accountBalance > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
              ¥{accountBalance.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
          <span className="text-sm text-gray-500">{TEXT.pendingActivationGoldBalance}</span>
          {userInfoLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
              <span className="text-sm text-gray-500">{TEXT.loading}</span>
            </div>
          ) : (
            <span className={`font-mono font-bold ${pendingActivationGold > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
              {pendingActivationGold.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-2">
        <div className="flex items-start gap-2">
          <Info size={14} className="mt-0.5 flex-shrink-0 text-blue-500" />
          <p className="text-xs leading-relaxed text-blue-700">{TEXT.freezeTip}</p>
        </div>
      </div>

      {!userInfoLoading && !isFundSufficient && (
        <div className="mt-3 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} />
          {TEXT.insufficient}
        </div>
      )}
    </div>
  )
}

export default ReservationFundCard
