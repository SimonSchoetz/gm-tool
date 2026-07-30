import { LoadingIcon, TextEditor } from '@/components';
import { useFoe } from '@/data-access-layer';
import { useParams, useRouterState } from '@tanstack/react-router';
import { FoeSidebar } from './components';
import {
  ScreensNameInput,
  ScreensTextEditorLayout,
  ScreensSummary,
} from '../components';

export const FoeScreen = () => {
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });

  const focusNameInput = useRouterState({
    select: (state) => state.location.state.focusNameInput ?? false,
  });

  const { foe, updateFoe, loading } = useFoe(foeId, adventureId);

  if (loading || !foe) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <ScreensTextEditorLayout
      sideBar={<FoeSidebar />}
      header={
        <ScreensSummary>
          <TextEditor
            placeholder='Foe Summary'
            value={foe.summary ?? ''}
            textEditorId={`FOE_${foe.id}_summary`}
            onChange={(summary) => {
              updateFoe({ summary });
            }}
          />
        </ScreensSummary>
      }
      body={
        <>
          <ScreensNameInput
            autoFocus={focusNameInput}
            placeholder='Foe Name'
            initValue={foe.name ?? ''}
            onCommit={(name) => {
              updateFoe({ name });
            }}
          />
          <TextEditor
            value={foe.description ?? ''}
            textEditorId={`FOE_${foe.id}_description`}
            onChange={(description) => {
              updateFoe({ description });
            }}
          />
        </>
      }
    />
  );
};
