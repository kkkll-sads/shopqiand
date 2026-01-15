import React from 'react';
import AddressList from '../../../pages/user/AddressList';
import { withNavigation } from '../../hoc/withNavigation';

const AddressListWithNav = withNavigation(AddressList);

const AddressListWrapper: React.FC = () => <AddressListWithNav />;

export default AddressListWrapper;
