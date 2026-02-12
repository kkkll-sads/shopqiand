import React from 'react'
import { ChevronLeft } from 'lucide-react'
import type { ShopDetailTab } from '../types'

interface ShopProductHeaderProps {
  headerStyle: 'transparent' | 'white'
  activeTab: ShopDetailTab
  onBack: () => void
  onTabClick: (tab: ShopDetailTab) => void
}

const tabs: Array<{ key: ShopDetailTab; label: string }> = [
  { key: 'product', label: '商品' },
  { key: 'reviews', label: '大家评' },
  { key: 'detail', label: '详情' },
]

const ShopProductHeader: React.FC<ShopProductHeaderProps> = ({
  headerStyle,
  activeTab,
  onBack,
  onTabClick,
}) => (
  <header
    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      headerStyle === 'white' ? 'bg-white shadow-sm' : 'bg-transparent'
    }`}
  >
    <div className={`flex items-center px-2 py-2 ${headerStyle === 'white' ? 'border-b border-gray-100' : ''}`}>
      <button
        onClick={onBack}
        className={`p-2 -ml-1 rounded-full transition-colors ${
          headerStyle === 'white' ? 'active:bg-gray-100' : 'bg-black/20 active:bg-black/30'
        }`}
      >
        <ChevronLeft size={22} className={headerStyle === 'white' ? 'text-gray-700' : 'text-white'} />
      </button>

      <div
        className={`flex-1 flex items-center justify-center gap-6 transition-opacity duration-300 ${
          headerStyle === 'white' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabClick(tab.key)}
            className={`text-sm py-1 relative ${activeTab === tab.key ? 'text-gray-900 font-bold' : 'text-gray-500'}`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  </header>
)

export default ShopProductHeader
