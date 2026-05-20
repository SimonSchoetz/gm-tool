import { GlassPanel, Input, CustomScrollArea, TextEditor } from '@/components';
import { useFaction } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import './FactionHeader.css';

export const FactionHeader = () => {
  const { adventureId, factionId } = useParams({
    from: '/adventure/$adventureId/faction/$factionId',
  });

  const { faction, updateFaction } = useFaction(factionId, adventureId);

  const [factionName, setFactionName] = useState(faction?.name ?? '');

  if (!faction) return null;

  return (
    <GlassPanel className='faction-summary' intensity='bright'>
      <Input
        placeholder='Name'
        value={factionName}
        onChange={(e) => {
          setFactionName(e.target.value);
          updateFaction({ name: e.target.value });
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
