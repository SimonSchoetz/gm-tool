import {
  GlassPanel,
  SyncedInput,
  CustomScrollArea,
  TextEditor,
} from '@/components';
import { useNpc } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import './NpcHeader.css';

export const NpcHeader = () => {
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });

  const { npc, updateNpc } = useNpc(npcId, adventureId);

  if (!npc) return null;

  return (
    <GlassPanel className='npc-summary' intensity='bright'>
      <SyncedInput
        placeholder='Name'
        initValue={npc.name ?? ''}
        onCommit={(name) => {
          updateNpc({ name });
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
