/**
 * ArtistWorksShowcase 页面包装器
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArtistWorksShowcase from '../../../pages/market/ArtistWorksShowcase';

const ArtistWorksShowcaseWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleNavigateToArtist = (artistId: number | string) => {
    navigate(`/artist/${artistId}`);
  };

  return (
    <ArtistWorksShowcase
      onBack={handleBack}
      onNavigateToArtist={handleNavigateToArtist}
    />
  );
};

export default ArtistWorksShowcaseWrapper;
