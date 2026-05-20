import './AdventureScreen.css';
import { CustomScrollArea, GlassPanel, TextEditor } from '@/components';

import { useParams } from '@tanstack/react-router';
import { useAdventure } from '@/data-access-layer';
import { useState } from 'react';
import { AdventureScreenHeader, AdventureScreenSidebar } from './components';

export const AdventureScreen = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure, loading } = useAdventure(adventureId);

  const [syncedAdventureId, setSyncedAdventureId] = useState(adventure?.id);

  if (adventure?.id !== syncedAdventureId) {
    setSyncedAdventureId(adventure?.id);
  }

  if (loading || !adventure) {
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className='adventure-screen'>
      <AdventureScreenSidebar />

      <CustomScrollArea>
        <AdventureScreenHeader />

        <TextEditor
          value={adventure.description ?? ''}
          textEditorId={`Adventure_${adventure.id}`}
          onChange={(description) => {
            updateAdventure({ description });
          }}
        />
      </CustomScrollArea>
    </GlassPanel>
  );
};
