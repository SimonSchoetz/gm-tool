import { useContext } from 'react';
import { AdventureContext } from './AdventureProvider';

export const useAdventures = () => {
  const context = useContext(AdventureContext);

  if (!context) {
    throw new Error('useAdventures must be used within an AdventureProvider');
  }

  return context;
};
