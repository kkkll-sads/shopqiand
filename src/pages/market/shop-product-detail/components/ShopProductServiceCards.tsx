import React from 'react'
import { ChevronRight, Headphones, Truck } from 'lucide-react'

interface ShopProductServiceCardsProps {
  onOpenService: () => void
  onOpenAddress: () => void
}

const ShopProductServiceCards: React.FC<ShopProductServiceCardsProps> = ({ onOpenService, onOpenAddress }) => (
  <>
    <div
      className="bg-white mt-1.5 px-3 py-2 active:bg-gray-50 cursor-pointer flex items-center justify-between"
      onClick={onOpenService}
    >
      <div className="flex items-center text-xs text-gray-500 gap-3">
        <span className="flex items-center gap-1">
          <Headphones size={12} className="text-green-500" />
          专属客服
        </span>
      </div>
      <ChevronRight size={14} className="text-gray-400" />
    </div>

    <div className="bg-white mt-1.5 px-3 py-2 active:bg-gray-50 cursor-pointer" onClick={onOpenAddress}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-blue-500" />
          <span className="text-blue-500 text-xs font-medium">预计明日达</span>
          <span className="text-xs text-gray-400">付款后预计1-3天送达</span>
        </div>
        <ChevronRight size={14} className="text-gray-400" />
      </div>
      <div className="text-[11px] text-gray-400 mt-1 ml-5">官方物流 · 全国包邮</div>
    </div>
  </>
)

export default ShopProductServiceCards
