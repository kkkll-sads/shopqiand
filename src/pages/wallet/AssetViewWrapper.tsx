import React from 'react';
import AssetView from '../../../pages/wallet/AssetView';
import { withNavigation } from '../../hoc/withNavigation';

const AssetViewWithNav = withNavigation(AssetView);

const AssetViewWrapper: React.FC = () => <AssetViewWithNav />;

export default AssetViewWrapper;
