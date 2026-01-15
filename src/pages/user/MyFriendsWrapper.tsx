import React from 'react';
import MyFriends from '../../../pages/user/MyFriends';
import { withNavigation } from '../../hoc/withNavigation';

const MyFriendsWithNav = withNavigation(MyFriends);

const MyFriendsWrapper: React.FC = () => <MyFriendsWithNav />;

export default MyFriendsWrapper;
