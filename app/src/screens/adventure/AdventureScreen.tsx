import './AdventureScreen.css';
import { CustomScrollArea, GlassPanel, Input } from '@/components';
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

  const startDate =
    adventure.created_at && new Date(adventure.created_at).toLocaleDateString();

  return (
    <GlassPanel className={cn('adventure-screen')}>
      <UploadAdventureImgBtn />
      <CustomScrollArea>
        <div className={cn('text-edit-area')}>
          <div>
            <Input
              type='text'
              placeholder='Adventure Title'
              value={adventure.title}
              onChange={(e) => handleAdventureUpdate({ title: e.target.value })}
              className='title-input'
              required
            />

            <ul className={cn('adventure-stats')}>
              <li>
                Started: <span>{startDate}</span>
              </li>
              <li>
                Sessions: <span>0</span>
              </li>
              <li>
                NPCs: <span>0</span>
              </li>
              <li>
                PCs: <span>0</span>
              </li>
              <li>
                Party Level: <span>0</span>
              </li>
            </ul>
          </div>

          <TextEditor
            value={adventure?.description || ''}
            textEditorId={`Adventure_${adventure.id}`}
            onChange={(description) => handleAdventureUpdate({ description })}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
