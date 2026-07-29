import { LoadingIcon, TextEditor } from '@/components';
import { useParams } from '@tanstack/react-router';
import { useAdventure } from '@/data-access-layer';
import { AdventureScreenHeader, AdventureScreenSidebar } from './components';
import { ScreensTextEditorLayout } from '../components';

export const AdventureScreen = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure, loading } = useAdventure(adventureId);

  if (loading || !adventure) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <ScreensTextEditorLayout
      header={<AdventureScreenHeader />}
      sideBar={<AdventureScreenSidebar />}
      body={
        <TextEditor
          value={adventure.description ?? ''}
          textEditorId={`ADVENTURE_${adventure.id}`}
          onChange={(description) => {
            updateAdventure({ description });
          }}
        />
      }
    />
  );
};
