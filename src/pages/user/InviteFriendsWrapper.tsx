import React from 'react';
import InviteFriends from '../../../pages/user/InviteFriends';
import { withNavigation } from '../../hoc/withNavigation';

const InviteFriendsWithNav = withNavigation(InviteFriends);

const InviteFriendsWrapper: React.FC = () => <InviteFriendsWithNav />;

export default InviteFriendsWrapper;
