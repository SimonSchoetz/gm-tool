import {
  GlassPanel,
  SyncedInput,
  CustomScrollArea,
  TextEditor,
} from '@/components';
import { useFaction } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import './FactionHeader.css';

export const FactionHeader = () => {
  const { adventureId, factionId } = useParams({
    from: '/adventure/$adventureId/faction/$factionId',
  });

  const { faction, updateFaction } = useFaction(factionId, adventureId);

  if (!faction) return null;

  return (
    <GlassPanel className='faction-summary' intensity='bright'>
      <SyncedInput
        placeholder='Name'
        initValue={faction.name ?? ''}
        onCommit={(name) => {
          updateFaction({ name });
        }}
        className='faction-name-input'
        required
      />

      <CustomScrollArea>
        <TextEditor
          placeholder='Summary'
          value={faction.summary ?? ''}
          textEditorId={`FACTION_${faction.id}_summary`}
          onChange={(summary) => {
            updateFaction({ summary });
          }}
        />
      </CustomScrollArea>
    </GlassPanel>
  );
};
