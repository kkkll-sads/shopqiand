import React from 'react';
import TradingZone from '../../../pages/market/TradingZone';
import { withNavigation } from '../../hoc/withNavigation';

const TradingZoneWithNav = withNavigation(TradingZone);

const TradingZoneWrapper: React.FC = () => <TradingZoneWithNav />;

export default TradingZoneWrapper;
