import React from 'react';
import NotificationSettings from '../../../pages/user/NotificationSettings';
import { withNavigation } from '../../hoc/withNavigation';

const NotificationSettingsWithNav = withNavigation(NotificationSettings);

const NotificationSettingsWrapper: React.FC = () => <NotificationSettingsWithNav />;

export default NotificationSettingsWrapper;
