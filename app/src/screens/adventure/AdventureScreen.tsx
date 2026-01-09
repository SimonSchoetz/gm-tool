import './AdventureScreen.css';
import { GlassPanel, Input, Textarea } from '@/components';
import { cn } from '@/util';
import { useParams } from '@tanstack/react-router';
import { useAdventures } from '@/data/adventures';
import { UploadAdventureImgBtn } from '@/components/AdventureComponents';
import { useEffect } from 'react';

export const AdventureScreen = () => {
  const { adventureId } = useParams({ from: '/adventures/$adventureId' });

  const { loadAdventure, adventure, setAdventure, handleAdventureUpdate } =
    useAdventures();

  useEffect(() => {
    loadAdventure(adventureId);
    // Cleanup: clear current adventure on unmount
    return () => {
      setAdventure(null);
    };
  }, [adventureId]);

  if (!adventure) {
    return (
      <GlassPanel className={cn('adventure-screen')}>Loading...</GlassPanel>
    );
  }

  return (
    <GlassPanel className={cn('adventure-screen')}>
      <div>
        <div>
          <Input
            type='text'
            placeholder='Adventure Title *'
            value={adventure.title}
            onChange={(e) => handleAdventureUpdate({ title: e.target.value })}
            required
          />
          <Textarea
            placeholder='Description'
            value={adventure.description ?? ''}
            onChange={(e) =>
              handleAdventureUpdate({ description: e.target.value })
            }
            rows={4}
          />
        </div>

        <UploadAdventureImgBtn />
      </div>
    </GlassPanel>
  );
};
