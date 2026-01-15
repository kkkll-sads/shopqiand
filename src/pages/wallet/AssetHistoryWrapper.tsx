import React from 'react';
import { useParams } from 'react-router-dom';
import AssetHistory from '../../../pages/wallet/AssetHistory';
import { withNavigation } from '../../hoc/withNavigation';

const AssetHistoryWithNav = withNavigation(AssetHistory);

const AssetHistoryWrapper: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  // AssetHistory might need type prop - but now handles it internally
  return <AssetHistoryWithNav />;
};

export default AssetHistoryWrapper;
