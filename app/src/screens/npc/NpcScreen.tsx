import { CustomScrollArea, GlassPanel, TextEditor } from '@/components';
import { cn } from '@/util';
import { useNpc } from '@/data-access-layer';
import './NpcScreen.css';
import { useParams } from '@tanstack/react-router';
import { NpcHeader, NpcSidebar } from './components';

export const NpcScreen = () => {
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });

  const { npc, updateNpc, loading } = useNpc(npcId, adventureId);

  if (loading || !npc) {
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className={cn('npc-screen')}>
      <NpcSidebar />

      <CustomScrollArea>
        <div className={cn('npc-text-edit-area')}>
          <NpcHeader />

          <TextEditor
            value={npc.description ?? ''}
            textEditorId={`NPC_${npc.id}_description`}
            onChange={(description) => {
              updateNpc({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
