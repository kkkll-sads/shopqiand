import React from 'react'
import { AlertCircle, CheckCircle2, Clock, Loader2, X } from 'lucide-react'
import type { ReservationItem, ReservationPaymentSummary } from '@/services'
import ReservationRecordCard from './ReservationRecordCard'

interface LatestReservationSubmission extends ReservationPaymentSummary {
  reservationId?: number
  zoneName?: string
  packageName?: string
  quantity: number
  totalRequiredHashrate: number
  submittedAt: number
}

interface ReservationRecordContentProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  isLoggedIn: boolean
  loading: boolean
  error: string | null
  records: ReservationItem[]
  hasMore: boolean
  loadingMore: boolean
  latestReservationSubmission: LatestReservationSubmission | null
  onDismissLatestSummary: () => void
  onRetry: () => void
  onLogin: () => void
  onCardClick: (record: ReservationItem) => void
  onGoCollection: () => void
  onScroll: () => void
}

const ReservationRecordContent: React.FC<ReservationRecordContentProps> = ({
  containerRef,
  isLoggedIn,
  loading,
  error,
  records,
  hasMore,
  loadingMore,
  latestReservationSubmission,
  onDismissLatestSummary,
  onRetry,
  onLogin,
  onCardClick,
  onGoCollection,
  onScroll,
}) => {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="p-4 space-y-3 h-[calc(100vh-260px)] overflow-y-auto"
    >
      {latestReservationSubmission && (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold mb-1">
                <CheckCircle2 size={14} />
                刚刚提交成功
              </div>
              <p className="text-base font-bold text-gray-900">冻结摘要已同步到记录页</p>
              {latestReservationSubmission.reservationId && (
                <p className="text-xs text-gray-500 mt-1">预约编号 #{latestReservationSubmission.reservationId}</p>
              )}
            </div>
            <button
              onClick={onDismissLatestSummary}
              className="w-8 h-8 rounded-full bg-white/80 border border-white text-gray-400 flex items-center justify-center active:scale-95"
              aria-label="关闭最新预约摘要"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl bg-white/90 p-3 border border-white">
              <p className="text-[11px] text-gray-500 mb-1">冻结总额</p>
              <p className="font-mono font-bold text-red-600">¥{latestReservationSubmission.freezeAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white/90 p-3 border border-white">
              <p className="text-[11px] text-gray-500 mb-1">算力消耗</p>
              <p className="font-mono font-bold text-orange-600">{latestReservationSubmission.totalRequiredHashrate}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center">
              <span>支付方式</span>
              <span className="font-medium text-gray-900">{latestReservationSubmission.payTypeText}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>冻结比例</span>
              <span className="font-medium text-gray-900">{latestReservationSubmission.ratioText}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>专项金冻结</span>
              <span className="font-medium text-blue-700">¥{latestReservationSubmission.specialFundFreezeAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>待激活确权金冻结</span>
              <span className="font-medium text-emerald-700">{latestReservationSubmission.pendingActivationGoldFreezeAmount.toLocaleString()} 待激活确权金</span>
            </div>
            <div className="flex justify-between items-center">
              <span>预约数量</span>
              <span className="font-medium text-gray-900">{latestReservationSubmission.quantity} 份</span>
            </div>
            {latestReservationSubmission.zoneName && (
              <div className="flex justify-between items-center">
                <span>价格分区</span>
                <span className="font-medium text-gray-900">{latestReservationSubmission.zoneName}</span>
              </div>
            )}
          </div>

          {latestReservationSubmission.source === 'fallback' && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700">
              当前摘要按提交前余额估算展示，实际冻结以后端提交结果为准。
            </div>
          )}
        </div>
      )}

      {!isLoggedIn ? (
        <div className="py-16 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">请先登录</h3>
          <p className="text-sm text-gray-500 mb-6">登录后即可查看您的申购记录</p>
          <button
            onClick={onLogin}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all"
          >
            去登录
          </button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-transform"
          >
            重试
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">暂无申购记录</p>
        </div>
      ) : (
        records.map((record) => (
          <ReservationRecordCard
            key={record.id}
            record={record}
            onClickDetail={onCardClick}
            onGoCollection={onGoCollection}
          />
        ))
      )}

      {loadingMore && (
        <div className="py-4 flex items-center justify-center text-gray-400 text-xs">
          <Loader2 size={16} className="animate-spin mr-2" />
          加载中...
        </div>
      )}

      {!loading && !hasMore && records.length > 0 && (
        <div className="py-4 text-center text-gray-400 text-xs">- 已加载全部 -</div>
      )}
    </div>
  )
}

export default ReservationRecordContent