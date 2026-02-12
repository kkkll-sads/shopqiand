import React from 'react'
import { Receipt, TrendingUp } from 'lucide-react'

interface CumulativeRightsOrderFundButtonProps {
  onClick: () => void
}

const CumulativeRightsOrderFundButton: React.FC<CumulativeRightsOrderFundButtonProps> = ({ onClick }) => {
  return (
    <div className="mb-6">
      <button
        onClick={onClick}
        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Receipt size={20} className="text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-base">订单资金详情</div>
            <div className="text-xs text-white/80">查看订单相关的资金明细记录</div>
          </div>
        </div>
        <TrendingUp size={20} className="opacity-80" />
      </button>
    </div>
  )
}

export default CumulativeRightsOrderFundButton
