import { CustomScrollArea, GlassPanel, TextEditor } from '@/components';
import { cn } from '@/util';
import { useFoe } from '@/data-access-layer';
import './FoeScreen.css';
import { useParams } from '@tanstack/react-router';
import { FoeHeader, FoeSidebar } from './components';

export const FoeScreen = () => {
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });

  const { foe, updateFoe, loading } = useFoe(foeId, adventureId);

  if (loading || !foe) {
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className={cn('foe-screen')}>
      <FoeSidebar />

      <CustomScrollArea>
        <div className={cn('foe-text-edit-area')}>
          <FoeHeader />

          <TextEditor
            value={foe.description ?? ''}
            textEditorId={`FOE_${foe.id}_description`}
            onChange={(description) => {
              updateFoe({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
