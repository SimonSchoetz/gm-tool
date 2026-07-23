import {
  GlassPanel,
  SyncedInput,
  CustomScrollArea,
  TextEditor,
} from '@/components';
import { usePc } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import './PcHeader.css';

export const PcHeader = () => {
  const { adventureId, pcId } = useParams({
    from: '/adventure/$adventureId/pc/$pcId',
  });

  const { pc, updatePc } = usePc(pcId, adventureId);

  if (!pc) return null;

  return (
    <GlassPanel className='pc-summary' intensity='bright'>
      <SyncedInput
        placeholder='Name'
        initValue={pc.name ?? ''}
        onCommit={(name) => {
          updatePc({ name });
        }}
        className='pc-name-input'
        required
      />

      <CustomScrollArea>
        <TextEditor
          placeholder='Summary'
          value={pc.summary ?? ''}
          textEditorId={`PC_${pc.id}_summary`}
          onChange={(summary) => {
            updatePc({ summary });
          }}
        />
      </CustomScrollArea>
    </GlassPanel>
  );
};
