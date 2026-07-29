import { LoadingIcon, TextEditor } from '@/components';
import { useFaction } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { FactionSidebar } from './components';
import {
  ScreensNameInput,
  ScreensTextEditorLayout,
  ScreensSummary,
} from '../components';

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
      sideBar={<FactionSidebar />}
      header={
        <ScreensSummary>
          <TextEditor
            placeholder='Faction Summary'
            value={faction.summary ?? ''}
            textEditorId={`FACTION_${faction.id}_summary`}
            onChange={(summary) => {
              updateFaction({ summary });
            }}
          />
        </ScreensSummary>
      }
      body={
        <>
          <ScreensNameInput
            placeholder='Faction Name'
            initValue={faction.name ?? ''}
            onCommit={(name) => {
              updateFaction({ name });
            }}
          />
          <TextEditor
            value={faction.description ?? ''}
            textEditorId={`FACTION_${faction.id}_description`}
            onChange={(description) => {
              updateFaction({ description });
            }}
          />
        </>
      }
    />
  );
};
