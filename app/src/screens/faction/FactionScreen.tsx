import { LoadingIcon, TextEditor } from '@/components';
import { useFaction } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { FactionHeader, FactionSidebar } from './components';
import { ScreensTextEditorLayout } from '../components';

export const FactionScreen = () => {
  const { adventureId, factionId } = useParams({
    from: '/adventure/$adventureId/faction/$factionId',
  });

  const { faction, updateFaction, loading } = useFaction(
    factionId,
    adventureId,
  );

  if (loading || !faction) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <ScreensTextEditorLayout
      header={<FactionHeader />}
      sideBar={<FactionSidebar />}
      textEditor={
        <TextEditor
          value={faction.description ?? ''}
          textEditorId={`FACTION_${faction.id}_description`}
          onChange={(description) => {
            updateFaction({ description });
          }}
        />
      }
    />
  );
};
