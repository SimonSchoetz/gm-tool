import { LoadingIcon, TextEditor } from '@/components';
import { useNpc } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { NpcHeader, NpcSidebar } from './components';
import { ScreensTextEditorLayout } from '../components';

export const NpcScreen = () => {
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });

  const { npc, updateNpc, loading } = useNpc(npcId, adventureId);

  if (loading || !npc) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <ScreensTextEditorLayout
      header={<NpcHeader />}
      sideBar={<NpcSidebar />}
      body={
        <TextEditor
          value={npc.description ?? ''}
          textEditorId={`NPC_${npc.id}_description`}
          onChange={(description) => {
            updateNpc({ description });
          }}
        />
      }
    />
  );
};
