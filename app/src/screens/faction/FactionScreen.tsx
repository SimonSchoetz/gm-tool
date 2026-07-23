import {
  CustomScrollArea,
  GlassPanel,
  LoadingIcon,
  TextEditor,
} from '@/components';
import { useFaction } from '@/data-access-layer';
import './FactionScreen.css';
import { useParams } from '@tanstack/react-router';
import { FactionHeader, FactionSidebar } from './components';

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
    <GlassPanel className='faction-screen'>
      <FactionSidebar />

      <CustomScrollArea>
        <div className='faction-text-edit-area'>
          <FactionHeader />

          <TextEditor
            value={faction.description ?? ''}
            textEditorId={`FACTION_${faction.id}_description`}
            onChange={(description) => {
              updateFaction({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
