/**
 * ProductActions - 底部操作栏组件
 */
import React from 'react';
import { Store, MessageCircle } from 'lucide-react';
import { openChatWidget } from '@/components/common';

interface ProductActionsProps {
  buying: boolean;
  onBuy: () => void;
  hideActions?: boolean;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  buying,
  onBuy,
  hideActions = false,
}) => {
  if (hideActions) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 py-2 pb-safe flex items-center z-50">
      {/* 左侧图标按钮 */}
      <div className="flex items-center gap-1">
        <button className="flex flex-col items-center justify-center w-12 py-0.5">
          <Store size={18} className="text-gray-500" />
          <span className="text-[9px] text-gray-500">店铺</span>
        </button>
        <button
          onClick={openChatWidget}
          className="flex flex-col items-center justify-center w-12 py-0.5"
        >
          <MessageCircle size={18} className="text-gray-500" />
          <span className="text-[9px] text-gray-500">客服</span>
        </button>
      </div>

      {/* 右侧按钮 - 立即购买 */}
      <div className="flex-1 ml-3">
        <button
          onClick={onBuy}
          disabled={buying}
          className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 rounded-full text-base font-bold active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-red-600/20"
        >
          {buying ? '处理中...' : '立即购买'}
        </button>
      </div>
    </div>
  );
};

export default ProductActions;
