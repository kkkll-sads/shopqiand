import React from 'react';
import ArtistShowcase from '../../../pages/market/ArtistShowcase';
import { withNavigation } from '../../hoc/withNavigation';

const ArtistShowcaseWithNav = withNavigation(ArtistShowcase);

const ArtistShowcaseWrapper: React.FC = () => <ArtistShowcaseWithNav />;

export default ArtistShowcaseWrapper;
