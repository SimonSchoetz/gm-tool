import { LoadingIcon, TextEditor } from '@/components';
import { useNpc } from '@/data-access-layer';
import { useParams, useRouterState } from '@tanstack/react-router';
import { NpcSidebar } from './components';
import {
  ScreensNameInput,
  ScreensTextEditorLayout,
  ScreensSummary,
} from '../components';

export const NpcScreen = () => {
  const { adventureId, npcId } = useParams({
    from: '/adventure/$adventureId/npc/$npcId',
  });

  const focusNameInput = useRouterState({
    select: (state) => state.location.state.focusNameInput ?? false,
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
      sideBar={<NpcSidebar />}
      header={
        <ScreensSummary>
          <TextEditor
            placeholder='NPC Summary'
            value={npc.summary ?? ''}
            textEditorId={`NPC_${npc.id}_summary`}
            onChange={(summary) => {
              updateNpc({ summary });
            }}
          />
        </ScreensSummary>
      }
      body={
        <>
          <ScreensNameInput
            autoFocus={focusNameInput}
            placeholder='NPC Name'
            initValue={npc.name ?? ''}
            onCommit={(name) => {
              updateNpc({ name });
            }}
          />
          <TextEditor
            value={npc.description ?? ''}
            textEditorId={`NPC_${npc.id}_description`}
            onChange={(description) => {
              updateNpc({ description });
            }}
          />
        </>
      }
    />
  );
};
