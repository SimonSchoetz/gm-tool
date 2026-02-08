import { useContext } from 'react';
import { NpcContext } from './NpcProvider';

export const useNpcs = () => {
  const context = useContext(NpcContext);

  if (!context) {
    throw new Error('useNpcs must be used within an NpcProvider');
  }

  return context;
};
