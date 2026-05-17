import './AdventureScreen.css';
import { CustomScrollArea, GlassPanel, Input, TextEditor } from '@/components';
import { cn } from '@/util';
import { getDateTimeString } from '@util';
import { useParams } from '@tanstack/react-router';
import { useAdventure } from '@/data-access-layer';
import { useState } from 'react';
import { AdventureScreenSidebar } from './components';

export const AdventureScreen = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure, loading } = useAdventure(adventureId);

  const [adventureName, setAdventureName] = useState(adventure?.name ?? '');
  const [syncedAdventureId, setSyncedAdventureId] = useState(adventure?.id);

  if (adventure?.id !== syncedAdventureId) {
    setSyncedAdventureId(adventure?.id);
    setAdventureName(adventure?.name ?? '');
  }

  if (loading || !adventure) {
    return <div>Loading...</div>;
  }

  const startDate =
    adventure.created_at && getDateTimeString(adventure.created_at);

  return (
    <GlassPanel className={cn('adventure-screen')}>
      <AdventureScreenSidebar />

      <CustomScrollArea>
        <div className={cn('adventure-text-edit-area')}>
          <div>
            <Input
              placeholder='Adventure Title'
              value={adventureName}
              onChange={(e) => {
                setAdventureName(e.target.value);
                updateAdventure({ name: e.target.value });
              }}
              className='adventure-title-input'
            />

            <ul className={cn('adventure-facts')}>
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
            value={adventure.description ?? ''}
            textEditorId={`Adventure_${adventure.id}`}
            onChange={(description) => {
              updateAdventure({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
