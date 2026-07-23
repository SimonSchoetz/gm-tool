import {
  GlassPanel,
  SyncedInput,
  CustomScrollArea,
  TextEditor,
} from '@/components';
import { useFoe } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import './FoeHeader.css';

export const FoeHeader = () => {
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });

  const { foe, updateFoe } = useFoe(foeId, adventureId);

  if (!foe) return null;

  return (
    <GlassPanel className='foe-summary' intensity='bright'>
      <SyncedInput
        placeholder='Name'
        initValue={foe.name ?? ''}
        onCommit={(name) => {
          updateFoe({ name });
        }}
        className='foe-name-input'
        required
      />

      <CustomScrollArea>
        <TextEditor
          placeholder='Summary'
          value={foe.summary ?? ''}
          textEditorId={`FOE_${foe.id}_summary`}
          onChange={(summary) => {
            updateFoe({ summary });
          }}
        />
      </CustomScrollArea>
    </GlassPanel>
  );
};
