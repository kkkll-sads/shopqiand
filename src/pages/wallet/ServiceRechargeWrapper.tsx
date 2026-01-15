import React from 'react';
import ServiceRecharge from '../../../pages/wallet/ServiceRecharge';
import { withNavigation } from '../../hoc/withNavigation';

const ServiceRechargeWithNav = withNavigation(ServiceRecharge);

const ServiceRechargeWrapper: React.FC = () => <ServiceRechargeWithNav />;

export default ServiceRechargeWrapper;
