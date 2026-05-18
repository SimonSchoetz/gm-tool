import { GlassPanel, Input, CustomScrollArea, TextEditor } from '@/components';
import { useFoe } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import './FoeHeader.css';

export const FoeHeader = () => {
  const { adventureId, foeId } = useParams({
    from: '/adventure/$adventureId/foe/$foeId',
  });

  const { foe, updateFoe } = useFoe(foeId, adventureId);

  const [foeName, setFoeName] = useState(foe?.name ?? '');

  if (!foe) return;

  return (
    <GlassPanel className='foe-summary' intensity='bright'>
      <Input
        placeholder='Name'
        value={foeName}
        onChange={(e) => {
          setFoeName(e.target.value);
          updateFoe({ name: e.target.value });
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
