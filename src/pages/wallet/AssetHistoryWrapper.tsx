import React from 'react';
import { useParams } from 'react-router-dom';
import AssetHistory from '../../../pages/wallet/AssetHistory';

const AssetHistoryWrapper: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  // AssetHistory might need type prop - but now handles it internally
  return <AssetHistory />;
};

export default AssetHistoryWrapper;
