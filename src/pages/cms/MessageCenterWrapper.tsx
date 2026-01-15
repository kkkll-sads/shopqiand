import React from 'react';
import MessageCenter from '../../../pages/cms/MessageCenter';
import { withNavigation } from '../../hoc/withNavigation';

const MessageCenterWithNav = withNavigation(MessageCenter);

const MessageCenterWrapper: React.FC = () => <MessageCenterWithNav />;

export default MessageCenterWrapper;
