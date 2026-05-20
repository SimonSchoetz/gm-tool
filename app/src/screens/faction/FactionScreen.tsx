import { CustomScrollArea, GlassPanel, TextEditor } from '@/components';
import { cn } from '@/util';
import { useFaction } from '@/data-access-layer';
import './FactionScreen.css';
import { useParams } from '@tanstack/react-router';
import { FactionHeader, FactionSidebar } from './components';

export const FactionScreen = () => {
  const { adventureId, factionId } = useParams({
    from: '/adventure/$adventureId/faction/$factionId',
  });

  const { faction, updateFaction, loading } = useFaction(factionId, adventureId);

  if (loading || !faction) {
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className={cn('faction-screen')}>
      <FactionSidebar />

      <CustomScrollArea>
        <div className={cn('faction-text-edit-area')}>
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
