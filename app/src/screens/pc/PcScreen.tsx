import { LoadingIcon, TextEditor } from '@/components';
import { usePc } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { useFocusNameInputOnArrival } from '@/hooks';
import { PcSidebar } from './components';
import {
  ScreensNameInput,
  ScreensTextEditorLayout,
  ScreensSummary,
} from '../components';

export const PcScreen = () => {
  const { adventureId, pcId } = useParams({
    from: '/adventure/$adventureId/pc/$pcId',
  });

  const focusNameInput = useFocusNameInputOnArrival();

  const { pc, updatePc, loading } = usePc(pcId, adventureId);

  if (loading || !pc) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <ScreensTextEditorLayout
      sideBar={<PcSidebar />}
      header={
        <ScreensSummary>
          <TextEditor
            placeholder='PC Summary'
            value={pc.summary ?? ''}
            textEditorId={`PC_${pc.id}_summary`}
            onChange={(summary) => {
              updatePc({ summary });
            }}
          />
        </ScreensSummary>
      }
      body={
        <>
          <ScreensNameInput
            autoFocus={focusNameInput}
            placeholder='PC Name'
            initValue={pc.name ?? ''}
            onCommit={(name) => {
              updatePc({ name });
            }}
          />
          <TextEditor
            value={pc.description ?? ''}
            textEditorId={`PC_${pc.id}_description`}
            onChange={(description) => {
              updatePc({ description });
            }}
          />
        </>
      }
    />
  );
};
