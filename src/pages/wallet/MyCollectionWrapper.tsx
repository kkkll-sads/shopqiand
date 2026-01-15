import React from 'react';
import MyCollection from '../../../pages/wallet/MyCollection';
import { withNavigation } from '../../hoc/withNavigation';

const MyCollectionWithNav = withNavigation(MyCollection);

const MyCollectionWrapper: React.FC = () => <MyCollectionWithNav />;

export default MyCollectionWrapper;
