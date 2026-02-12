import React from 'react'
import type { BalanceCardItem } from '../types'

interface CumulativeRightsBalanceSectionProps {
  items: BalanceCardItem[]
}

const CumulativeRightsBalanceSection: React.FC<CumulativeRightsBalanceSectionProps> = ({ items }) => {
  return (
    <div className="mb-6">
      <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-2">账户余额</div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center mb-2`}>
              <item.icon size={20} className={item.color} />
            </div>
            <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
            <div className={`text-lg font-bold ${item.color} mb-1 font-[DINAlternate-Bold,Roboto,sans-serif]`}>
              {item.value}
            </div>
            <div className="text-[10px] text-gray-400 leading-tight">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CumulativeRightsBalanceSection
