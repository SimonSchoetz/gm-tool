import './AdventureScreen.css';
import { GlassPanel, Input } from '@/components';
import { cn } from '@/util';
import { useParams } from '@tanstack/react-router';
import { useAdventures } from '@/data/adventures';
import { UploadAdventureImgBtn } from '@/components/AdventureComponents';
import { useEffect } from 'react';
import { Routes } from '@/routes';
import { TextEditor } from '@/components/TextEditor/TextEditor';

export const AdventureScreen = () => {
  const { adventureId } = useParams({
    from: `${Routes.ADVENTURE}/$adventureId`,
  });

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
      <UploadAdventureImgBtn />
      <div className={cn('text-edit-area')}>
        <Input
          type='text'
          placeholder='Adventure Title'
          value={adventure.title}
          onChange={(e) => handleAdventureUpdate({ title: e.target.value })}
          className='title-input'
          required
        />
        <TextEditor
          value={adventure?.description || ''}
          textEditorId={`Adventure_${adventure.id}`}
          onChange={(description) => handleAdventureUpdate({ description })}
        />
      </div>
    </GlassPanel>
  );
};
