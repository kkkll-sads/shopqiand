import React from 'react';
import MasterpieceShowcase from '../../../pages/market/MasterpieceShowcase';
import { withNavigation } from '../../hoc/withNavigation';

const MasterpieceShowcaseWithNav = withNavigation(MasterpieceShowcase);

const MasterpieceShowcaseWrapper: React.FC = () => <MasterpieceShowcaseWithNav />;

export default MasterpieceShowcaseWrapper;
