import React from 'react';
import type { PriceRange } from '@/services/shop';
import type { ScorePriceRange } from './types';

interface PriceDisplayProps {
  displayPrice: number | null;
  useSkuMode: boolean;
  priceRange: PriceRange | null;
  greenPowerAmount: number;
  balanceAvailableAmount: number;
  displayScorePrice: number | ScorePriceRange;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  displayPrice,
  useSkuMode,
  priceRange,
  greenPowerAmount,
  balanceAvailableAmount,
  displayScorePrice,
}) => {
  const parts: React.ReactNode[] = [];

  if (displayPrice !== null && displayPrice > 0) {
    parts.push(
      <span key="price" className="text-red-500">
        <span className="text-sm">¥</span>
        <span className="text-2xl font-bold font-[DINAlternate-Bold]">{displayPrice.toFixed(2)}</span>
      </span>
    );
  } else if (useSkuMode && priceRange && priceRange.min !== priceRange.max) {
    parts.push(
      <span key="price-range" className="text-red-500">
        <span className="text-sm">¥</span>
        <span className="text-xl font-bold font-[DINAlternate-Bold]">{priceRange.min.toFixed(2)}</span>
        <span className="text-sm mx-1">-</span>
        <span className="text-sm">¥</span>
        <span className="text-xl font-bold font-[DINAlternate-Bold]">{priceRange.max.toFixed(2)}</span>
      </span>
    );
  }

  if (greenPowerAmount > 0) {
    if (parts.length > 0) parts.push(<span key="plus1" className="text-gray-400 mx-1">+</span>);
    parts.push(<span key="green" className="text-green-500 text-sm">{greenPowerAmount}绿色能量</span>);
  }

  if (balanceAvailableAmount > 0) {
    if (parts.length > 0) parts.push(<span key="plus2" className="text-gray-400 mx-1">+</span>);
    parts.push(<span key="balance" className="text-blue-500 text-sm">{balanceAvailableAmount}余额</span>);
  }

  if (typeof displayScorePrice === 'object' && displayScorePrice !== null) {
    if (parts.length > 0) parts.push(<span key="plus3" className="text-gray-400 mx-1">+</span>);
    parts.push(
      <span key="score" className="text-red-500">
        <span className="text-xl font-bold">{displayScorePrice.min}</span>
        <span className="text-sm mx-0.5">-</span>
        <span className="text-xl font-bold">{displayScorePrice.max}</span>
        <span className="text-sm ml-0.5">消费金</span>
      </span>
    );
  } else if (typeof displayScorePrice === 'number' && displayScorePrice > 0) {
    if (parts.length > 0) parts.push(<span key="plus3" className="text-gray-400 mx-1">+</span>);
    parts.push(
      <span key="score" className="text-red-500">
        <span className="text-2xl font-bold">{displayScorePrice}</span>
        <span className="text-sm ml-0.5">消费金</span>
      </span>
    );
  }

  if (parts.length === 0) {
    return <span className="text-red-500 text-xl font-bold">免费</span>;
  }

  return <>{parts}</>;
};

export default PriceDisplay;
