import React from 'react'
import type { AccountIncomeInfo } from '@/services/wallet'
import { formatAmount } from '@/utils/format'
import type { IncomeCardItem } from '../types'

interface CumulativeRightsIncomeSectionProps {
  income: AccountIncomeInfo | null
  items: IncomeCardItem[]
}

const CumulativeRightsIncomeSection: React.FC<CumulativeRightsIncomeSectionProps> = ({ income, items }) => {
  return (
    <div className="mb-6">
      <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-orange-500 pl-2">历史收益统计</div>
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs opacity-80 mb-1">累计可提现收益</div>
            <div className="text-xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
              {formatAmount(income?.total_income_withdrawable || 0)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80 mb-1">累计消费金收益</div>
            <div className="text-xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
              {income?.total_income_score || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${item.bgColor} flex items-center justify-center`}>
                <item.icon size={16} className={item.color} />
              </div>
              <div className="text-xs text-gray-600">{item.label}</div>
            </div>
            <div className={`text-base font-bold ${item.color} font-[DINAlternate-Bold,Roboto,sans-serif]`}>
              {item.value}
            </div>
            {item.scoreValue > 0 && <div className="text-[10px] text-gray-400 mt-0.5">消费金: {item.scoreValue}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CumulativeRightsIncomeSection
