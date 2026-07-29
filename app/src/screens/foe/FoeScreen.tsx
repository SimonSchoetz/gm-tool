import { LoadingIcon, TextEditor } from '@/components';
import { useFoe } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { FoeHeader, FoeSidebar } from './components';
import { ScreensTextEditorLayout } from '../components';

export const FoeScreen = () => {
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
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
      header={<FoeHeader />}
      sideBar={<FoeSidebar />}
      textEditor={
        <TextEditor
          value={foe.description ?? ''}
          textEditorId={`FOE_${foe.id}_description`}
          onChange={(description) => {
            updateFoe({ description });
          }}
        />
      }
    />
  );
};
