import React from 'react';
import Market from '../market/Market';
import { type Product } from '../../types';

interface MarketEntryProps {
  onProductSelect: (product: Product) => void;
}

const MarketEntry: React.FC<MarketEntryProps> = ({ onProductSelect }) => {
  return <Market onProductSelect={onProductSelect} />;
};

export default MarketEntry;
