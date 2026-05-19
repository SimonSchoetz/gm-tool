import { CustomScrollArea, GlassPanel, TextEditor } from '@/components';
import { cn } from '@/util';
import { usePc } from '@/data-access-layer';
import './PcScreen.css';
import { useParams } from '@tanstack/react-router';
import { PcHeader, PcSidebar } from './components';

export const PcScreen = () => {
  const { adventureId, pcId } = useParams({
    from: '/adventure/$adventureId/pc/$pcId',
  });

  const { pc, updatePc, loading } = usePc(pcId, adventureId);

  if (loading || !pc) {
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className={cn('pc-screen')}>
      <PcSidebar />

      <CustomScrollArea>
        <div className={cn('pc-text-edit-area')}>
          <PcHeader />

          <TextEditor
            value={pc.description ?? ''}
            textEditorId={`PC_${pc.id}_description`}
            onChange={(description) => {
              updatePc({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
