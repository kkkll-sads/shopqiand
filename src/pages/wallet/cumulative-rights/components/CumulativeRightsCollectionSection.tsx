import React from 'react'
import { Pickaxe } from 'lucide-react'
import type { CollectionInfo } from '@/services/wallet'
import { formatAmount } from '@/utils/format'
import type { CollectionStatItem } from '../types'

interface CumulativeRightsCollectionSectionProps {
  collection: CollectionInfo | null
  stats: CollectionStatItem[]
}

const CumulativeRightsCollectionSection: React.FC<CumulativeRightsCollectionSectionProps> = ({ collection, stats }) => {
  return (
    <div className="mb-6">
      <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-purple-500 pl-2">藏品价值统计</div>

      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-4 text-white mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs opacity-80 mb-1">藏品总价值</div>
            <div className="text-xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
              {formatAmount(collection?.total_value || 0)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80 mb-1">平均价格</div>
            <div className="text-xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
              {formatAmount(collection?.avg_price || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-2 text-center">
          {stats.map((stat, idx) => (
            <div key={idx}>
              <div className="text-lg font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif]">{stat.value}</div>
              <div className="text-[10px] text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {collection && collection.mining_count > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Pickaxe size={20} className="text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">矿机总价值</div>
              <div className="text-base font-bold text-amber-600 font-[DINAlternate-Bold,Roboto,sans-serif]">
                {formatAmount(collection.mining_value || 0)}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400">共 {collection.mining_count} 台</div>
        </div>
      )}
    </div>
  )
}

export default CumulativeRightsCollectionSection
