import { GlassPanel, Input, CustomScrollArea, TextEditor } from '@/components';
import { usePc } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import './PcHeader.css';

export const PcHeader = () => {
  const { adventureId, pcId } = useParams({
    from: '/adventure/$adventureId/pc/$pcId',
  });

  const { pc, updatePc } = usePc(pcId, adventureId);

  const [pcName, setPcName] = useState(pc?.name ?? '');

  if (!pc) return null;

  return (
    <GlassPanel className='pc-summary' intensity='bright'>
      <Input
        placeholder='Name'
        value={pcName}
        onChange={(e) => {
          setPcName(e.target.value);
          updatePc({ name: e.target.value });
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
