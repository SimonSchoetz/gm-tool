import { LoadingIcon, TextEditor } from '@/components';
import { usePc } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { PcHeader, PcSidebar } from './components';
import { ScreensTextEditorLayout } from '../components';

export const PcScreen = () => {
  const { adventureId, pcId } = useParams({
    from: '/adventure/$adventureId/pc/$pcId',
  });

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
      header={<PcHeader />}
      sideBar={<PcSidebar />}
      body={
        <TextEditor
          value={pc.description ?? ''}
          textEditorId={`PC_${pc.id}_description`}
          onChange={(description) => {
            updatePc({ description });
          }}
        />
      }
    />
  );
};
