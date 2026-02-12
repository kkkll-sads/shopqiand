import React from 'react'
import type { FundExplanationItem } from '../types'

interface CumulativeRightsFundExplanationProps {
  items: FundExplanationItem[]
}

const CumulativeRightsFundExplanation: React.FC<CumulativeRightsFundExplanationProps> = ({ items }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-2">资金说明</div>
      <div className="space-y-2 text-xs text-gray-600">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${item.dotColorClass} mt-1.5 flex-shrink-0`} />
            <div>{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CumulativeRightsFundExplanation
