import React from 'react';
import ConsignmentVoucher from '../../../pages/wallet/ConsignmentVoucher';
import { withNavigation } from '../../hoc/withNavigation';

const ConsignmentVoucherWithNav = withNavigation(ConsignmentVoucher);

const ConsignmentVoucherWrapper: React.FC = () => <ConsignmentVoucherWithNav />;

export default ConsignmentVoucherWrapper;
