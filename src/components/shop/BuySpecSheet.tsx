import React, { useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { LazyImage } from '../../../components/common';

export interface ProductSpec {
  id: string;
  name: string;
  values: string[];
}

export interface BuySpecSheetProps {
  visible: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  price: number;
  scorePrice?: number;
  greenPowerAmount?: number;
  balanceAvailableAmount?: number;
  stock: number;
  maxPurchase?: number;
  specs?: ProductSpec[];
  onConfirm: (quantity: number, selectedSpecs?: Record<string, string>) => void;
}

const BuySpecSheet: React.FC<BuySpecSheetProps> = ({
  visible,
  onClose,
  productName,
  productImage,
  price,
  scorePrice = 0,
  greenPowerAmount = 0,
  balanceAvailableAmount = 0,
  stock,
  maxPurchase = 99,
  specs = [],
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});

  // 计算实际限购数量
  const actualMax = Math.min(stock, maxPurchase);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < actualMax) {
      setQuantity(quantity + 1);
    }
  };

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      if (num < 1) {
        setQuantity(1);
      } else if (num > actualMax) {
        setQuantity(actualMax);
      } else {
        setQuantity(num);
      }
    }
  };

  const handleSelectSpec = (specName: string, value: string) => {
    setSelectedSpecs(prev => ({
      ...prev,
      [specName]: value,
    }));
  };

  const handleConfirm = () => {
    onConfirm(quantity, specs.length > 0 ? selectedSpecs : undefined);
  };

  // 检查是否所有规格都已选择
  const allSpecsSelected = specs.length === 0 || specs.every(spec => selectedSpecs[spec.name]);

  // 渲染价格显示
  const renderPriceDisplay = () => {
    const parts: React.ReactNode[] = [];
    
    // 现金价格
    if (price > 0) {
      parts.push(
        <span key="price" className="text-red-500">
          <span className="text-sm">¥</span>
          <span className="text-2xl font-bold">{price.toFixed(2)}</span>
        </span>
      );
    }
    
    // 绿色能量
    if (greenPowerAmount > 0) {
      if (parts.length > 0) parts.push(<span key="plus1" className="text-gray-400 mx-1">+</span>);
      parts.push(
        <span key="green" className="text-green-500 text-sm">{greenPowerAmount}绿色能量</span>
      );
    }
    
    // 余额可用金额
    if (balanceAvailableAmount > 0) {
      if (parts.length > 0) parts.push(<span key="plus2" className="text-gray-400 mx-1">+</span>);
      parts.push(
        <span key="balance" className="text-blue-500 text-sm">{balanceAvailableAmount}余额</span>
      );
    }
    
    // 消费金
    if (scorePrice > 0) {
      if (parts.length > 0) parts.push(<span key="plus3" className="text-gray-400 mx-1">+</span>);
      parts.push(
        <span key="score" className="text-red-500">
          <span className="text-2xl font-bold">{scorePrice}</span>
          <span className="text-sm ml-0.5">消费金</span>
        </span>
      );
    }
    
    // 如果全为0，显示免费
    if (parts.length === 0) {
      return <span className="text-red-500 text-xl font-bold">免费</span>;
    }
    
    return <>{parts}</>;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative w-full max-w-[480px] bg-white rounded-t-2xl animate-slide-up overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={18} className="text-gray-500" />
        </button>
        
        {/* 商品信息区 */}
        <div className="flex gap-3 p-4 pb-3">
          {/* 商品图片 */}
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <LazyImage
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* 价格和库存 */}
          <div className="flex-1 flex flex-col justify-end pt-6">
            <div className="flex items-baseline flex-wrap">
              {renderPriceDisplay()}
            </div>
            <div className="text-gray-400 text-xs mt-1.5">
              库存 {stock} 件 {maxPurchase && maxPurchase < stock && `· 限购${maxPurchase}件`}
            </div>
          </div>
        </div>
        
        {/* 规格选择区 */}
        {specs.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 max-h-[200px] overflow-y-auto">
            {specs.map((spec) => (
              <div key={spec.id} className="mb-4 last:mb-0">
                <div className="text-sm text-gray-700 mb-2">{spec.name}</div>
                <div className="flex flex-wrap gap-2">
                  {spec.values.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleSelectSpec(spec.name, value)}
                      className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                        selectedSpecs[spec.name] === value
                          ? 'border-red-500 bg-red-50 text-red-500'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 数量选择区 */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">购买数量</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  quantity <= 1
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                }`}
              >
                <Minus size={16} />
              </button>
              <input
                type="text"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-12 h-8 text-center border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleIncrease}
                disabled={quantity >= actualMax}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  quantity >= actualMax
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                }`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="p-4 pb-safe border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={!allSpecsSelected || stock === 0}
            className={`w-full py-3 rounded-xl text-white font-semibold text-base transition-all ${
              allSpecsSelected && stock > 0
                ? 'bg-gradient-to-r from-red-500 to-orange-500 active:opacity-90'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {stock === 0 
              ? '暂时缺货' 
              : !allSpecsSelected 
                ? '请选择规格' 
                : '确认'}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .pb-safe {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
};

export default BuySpecSheet;
