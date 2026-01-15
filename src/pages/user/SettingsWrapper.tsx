/**
 * Settings 页面包装器
 */
import React from 'react';
import Settings from '../../../pages/user/Settings';
import { withNavigation } from '../../hoc/withNavigation';

const SettingsWithNav = withNavigation(Settings);

const SettingsWrapper: React.FC = () => <SettingsWithNav />;

export default SettingsWrapper;
