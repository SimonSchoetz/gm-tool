import { useSearch } from '@tanstack/react-router';
import { useAdventures } from '@/data/adventures';
import { useEffect } from 'react';
import { Routes } from '@/routes';

export const NpcsScreen = ({ ...props }) => {
  const { adventureId } = useSearch({
    from: Routes.NPCS,
  });

  const { loadAdventure, adventure } = useAdventures();

  useEffect(() => {
    if (adventureId) {
      loadAdventure(adventureId);
    }
  }, [adventureId]);

  if (!adventureId) {
    return <div {...props}>No adventure selected</div>;
  }

  if (!adventure) {
    return <div {...props}>Loading...</div>;
  }

  return <div {...props}>NPCs for {adventure.title}</div>;
};
