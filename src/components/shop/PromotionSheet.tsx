/**
 * PromotionSheet - 优惠详情弹窗内容
 * 
 * 展示已享受优惠、可再享优惠、开通立享等信息
 * 参考京东商品详情页优惠弹窗设计
 */
import React, { useState } from 'react';
import { ChevronRight, Gift, Tag, Crown, Info } from 'lucide-react';

interface PromotionSheetProps {
  /** 当前价格 */
  price: number;
  /** 原价 */
  originalPrice: number;
  /** 消费金 */
  scorePrice?: number;
  /** 优惠截止日期 */
  promotionEndDate?: string;
}

type TabKey = 'enjoyed' | 'more' | 'plus';

const PromotionSheet: React.FC<PromotionSheetProps> = ({
  price,
  originalPrice,
  scorePrice = 0,
  promotionEndDate = '2026.01.30 23:59',
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('enjoyed');
  const savedAmount = originalPrice - price;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'enjoyed', label: '已享受优惠' },
    { key: 'more', label: '可再享优惠' },
    { key: 'plus', label: '开通立享' },
  ];

  return (
    <div className="pb-6">
      {/* Tab 切换 */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative text-sm pb-2 ${
              activeTab === tab.key 
                ? 'text-gray-900 font-medium' 
                : 'text-gray-500'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 已享受优惠 */}
      {activeTab === 'enjoyed' && (
        <div className="px-4 py-4">
          {/* 到手价展示 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-red-500 text-3xl font-bold">¥{price}</span>
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">到手价</span>
            </div>
            <div className="text-center text-sm text-red-500">
              购买立减 <span className="font-bold">¥{savedAmount}</span>
            </div>
            
            {/* 价格明细 */}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
              <span>= ¥{originalPrice}</span>
              <span>-</span>
              <span>促销 ¥{savedAmount}</span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-1 text-[10px] text-gray-400">
              <span>补贴价</span>
              <span></span>
              <span>首购礼金{savedAmount}</span>
            </div>
          </div>

          {/* 首购礼金 */}
          <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-red-500 text-xl font-bold">¥{savedAmount}</span>
              <span className="text-[10px] text-red-500 border border-red-200 px-1.5 py-0.5 rounded mt-1">
                首购礼金
              </span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">店铺新客限时优惠</div>
              <div className="text-xs text-gray-400 mt-1">{promotionEndDate} 前有效</div>
            </div>
          </div>
        </div>
      )}

      {/* 可再享优惠 */}
      {activeTab === 'more' && (
        <div className="px-4 py-4">
          <h4 className="text-base font-medium text-gray-800 mb-3">可再享优惠</h4>
          
          {/* 限购优惠 */}
          <div className="border border-gray-100 rounded-xl p-4 mb-3">
            <div className="flex items-start gap-3">
              <span className="text-[10px] text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded flex-shrink-0">
                限购
              </span>
              <div className="flex-1 text-sm text-gray-700 leading-relaxed">
                购买至少1件时可享受单件价 ¥ {(price * 0.95).toFixed(2)}，超出数量以结算价为准
              </div>
            </div>
          </div>

          {/* 换购优惠 */}
          <div className="border border-gray-100 rounded-xl p-4 mb-3 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="text-[10px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded flex-shrink-0">
                换购
              </span>
              <span className="text-sm text-gray-700">购买1件可优惠换购热销商品</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>

          {/* 满额返超市卡 */}
          <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="text-[10px] text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded flex-shrink-0">
                满额返超市卡
              </span>
              <div className="flex-1 text-sm text-gray-700 leading-relaxed">
                指定商品订单金额满149元，下单预计可返5%超市卡（最高可返20元，有效期30天）
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* 开通立享 */}
      {activeTab === 'plus' && (
        <div className="px-4 py-4">
          <h4 className="text-base font-medium text-gray-800 mb-3">开通立享</h4>
          
          {/* PLUS 会员 */}
          <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-yellow-400 text-xs font-bold">PLUS</span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">PLUS会员</span>
            </div>
            <div className="flex-1 border-l border-gray-100 pl-4">
              <div className="text-sm text-gray-800">
                PLUS额外省 <span className="text-red-500 font-bold">{(price * 0.1).toFixed(2)}</span> 元
              </div>
            </div>
            <button className="bg-red-500 text-white text-xs px-3 py-2 rounded-lg">
              立即<br/>开通
            </button>
          </div>

          {/* 提示信息 */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              以上仅为初步预估，不代表最终价格，点击查看规则
              <Info size={12} />
            </p>
            <p className="text-xs text-gray-400 mt-1">-此商品不可使用京券-</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionSheet;
