import React from 'react';
import ClaimStation from '../wallet/ClaimStation';
import { Route } from '../../router/routes';

interface RightsEntryProps {
  onNavigate: (route: Route) => void;
}

const RightsEntry: React.FC<RightsEntryProps> = ({ onNavigate }) => {
  return <ClaimStation onNavigate={onNavigate} />;
};

export default RightsEntry;

