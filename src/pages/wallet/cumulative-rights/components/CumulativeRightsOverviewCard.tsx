import React from 'react'
import { ShieldCheck } from 'lucide-react'

const CumulativeRightsOverviewCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={24} />
          <div className="text-sm opacity-90">我的权益</div>
        </div>
        <div className="text-2xl font-bold mb-4">资产全景</div>
        <div className="text-sm opacity-80">当前所有资金账户概览</div>
      </div>
    </div>
  )
}

export default CumulativeRightsOverviewCard
