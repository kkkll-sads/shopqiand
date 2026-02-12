import React from 'react';
import { Copy, Package } from 'lucide-react';
import { LazyImage } from '@/components/common';
import { normalizeAssetUrl } from '@/services/config';
import { formatAmount } from '@/utils/format';
import { CollectionOrderDetailData } from '@/services/collection/my-collection';

interface CollectionOrderItemsCardProps {
  order: CollectionOrderDetailData;
  onCopy: (text: string) => void;
}

const CollectionOrderItemsCard: React.FC<CollectionOrderItemsCardProps> = ({ order, onCopy }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50 mx-4">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
        <Package className="w-4 h-4 text-purple-600" />
      </div>
      <h2 className="font-semibold text-gray-900 text-base">订单明细</h2>
    </div>

    <div className="space-y-4">
      {order.items && order.items.length > 0 ? (
        order.items.map((item) => (
          <div key={item.id} className="bg-gray-50 rounded-lg p-3 space-y-3">
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <LazyImage
                  src={normalizeAssetUrl(item.item_image)}
                  alt={item.item_title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{item.item_title}</div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>成交价: {formatAmount(item.buy_price || item.price)}</span>
                  <span>x{item.quantity}</span>
                </div>
                <div className="text-sm font-bold text-orange-600 mt-1">{formatAmount(item.subtotal)}</div>
              </div>
            </div>

            {(item.asset_code ||
              item.hash ||
              item.contract_no ||
              item.session_title ||
              item.mining_status !== undefined) && (
              <div className="border-t border-gray-200/50 pt-3 grid grid-cols-1 gap-y-2 text-xs">
                {item.asset_code && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500">资产编号</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-gray-900 font-mono truncate max-w-[150px]" title={item.asset_code}>
                        {item.asset_code}
                      </span>
                      <button onClick={() => onCopy(item.asset_code!)} className="text-gray-400 hover:text-gray-600">
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                )}

                {item.contract_no && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500">合约编号</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-gray-900 font-mono truncate max-w-[150px]" title={item.contract_no}>
                        {item.contract_no}
                      </span>
                      <button onClick={() => onCopy(item.contract_no!)} className="text-gray-400 hover:text-gray-600">
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                )}

                {item.hash && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 flex-shrink-0">链上哈希</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-gray-900 font-mono truncate max-w-[150px]" title={item.hash}>
                        {item.hash}
                      </span>
                      <button onClick={() => onCopy(item.hash!)} className="text-gray-400 hover:text-gray-600">
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                )}

                {(item.session_title || item.session_start_time) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">交易场次</span>
                    <div className="text-right">
                      <div className="text-gray-900">{item.session_title || '未知场次'}</div>
                      {(item.session_start_time || item.session_end_time) && (
                        <div className="text-[10px] text-gray-400 scale-90 origin-right">
                          {item.session_start_time}-{item.session_end_time}
                          {item.is_trading_time !== undefined && (
                            <span className={`ml-1 ${item.is_trading_time ? 'text-green-500' : 'text-red-500'}`}>
                              ({item.is_trading_time ? '交易中' : '非交易时段'})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {item.mining_status !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">产出状态</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-600 border border-green-100">
                      {item.mining_status === 1 ? '正在产出' : '未激活'}
                    </span>
                  </div>
                )}

                {item.mining_start_time && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">开始时间</span>
                    <span className="text-gray-700">{item.mining_start_time}</span>
                  </div>
                )}

                {item.last_dividend_time && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">上次结算</span>
                    <span className="text-gray-700">{item.last_dividend_time}</span>
                  </div>
                )}

                {item.expected_profit !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">预期收益</span>
                    <span className="text-orange-600 font-bold">+{item.expected_profit}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">暂无订单明细</div>
      )}
    </div>

    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
      <span className="text-base font-semibold text-gray-900">订单总额</span>
      <span className="text-2xl font-bold text-orange-600 font-[DINAlternate-Bold,Roboto,sans-serif]">
        {formatAmount(order.total_amount)}
      </span>
    </div>
  </div>
);

export default CollectionOrderItemsCard;
