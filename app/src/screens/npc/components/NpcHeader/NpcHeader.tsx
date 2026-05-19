import { GlassPanel, Input, CustomScrollArea, TextEditor } from '@/components';
import { useNpc } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import './NpcHeader.css';

export const NpcHeader = () => {
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });

  const { npc, updateNpc } = useNpc(npcId, adventureId);

  const [npcName, setNpcName] = useState(npc?.name ?? '');

  if (!npc) return null;

  return (
    <GlassPanel className='npc-summary' intensity='bright'>
      <Input
        placeholder='Name'
        value={npcName}
        onChange={(e) => {
          setNpcName(e.target.value);
          updateNpc({ name: e.target.value });
        }}
        className='npc-name-input'
        required
      />

      <CustomScrollArea>
        <TextEditor
          placeholder='Summmary'
          value={npc.summary ?? ''}
          textEditorId={`NPC_${npc.id}_summary`}
          onChange={(summary) => {
            updateNpc({ summary });
          }}
        />
      </CustomScrollArea>
    </GlassPanel>
  );
};
