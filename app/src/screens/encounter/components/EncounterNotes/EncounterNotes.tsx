import { useParams } from '@tanstack/react-router';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { TextEditor } from '@/components/TextEditor';
import { useEncounter } from '@/data-access-layer';
import { PREVIEW_HEIGHT } from '../../../screens.constants';
import './EncounterNotes.css';

export const EncounterNotes = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, updateEncounter } = useEncounter(encounterId, adventureId);

  if (!encounter) return;

  const onDescriptionChange = (description: string) => {
    updateEncounter({ description });
  };

  return (
    <GlassPanel
      intensity='bright'
      className='encounter-notes'
      style={
        {
          '--encounter-notes-height': `${PREVIEW_HEIGHT}px`,
        } as React.CSSProperties
      }
    >
      <div className='encounter-notes-scroll scroll-edge-fade scroll-edge-fade--sm'>
        <TextEditor
          textEditorId={`ENCOUNTER_${encounter.id}_description`}
          value={encounter.description ?? ''}
          onChange={onDescriptionChange}
          placeholder='Global combat notes...'
        />
      </div>
    </GlassPanel>
  );
};
