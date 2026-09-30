import { useContext } from 'react';
import { PinnedPopupsContext } from './PinnedPopupsContext';

export const usePinnedPopups = () => {
  const ctx = useContext(PinnedPopupsContext);
  if (!ctx)
    throw new Error('usePinnedPopups must be used within PinnedPopupsProvider');
  return ctx;
};
