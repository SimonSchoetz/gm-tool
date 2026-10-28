import { useParams } from '@tanstack/react-router';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { TextEditor } from '@/components/TextEditor';
import { useEncounter } from '@/data-access-layer';
import './EncounterNotes.css';

export const EncounterNotes = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, updateEncounter } = useEncounter(encounterId, adventureId);

  if (!encounter) return;

  return (
    <GlassPanel intensity='bright' className='encounter-notes'>
      <TextEditor
        className='encounter-notes-text-editor'
        textEditorId={`ENCOUNTER_${encounter.id}_description`}
        value={encounter.description ?? ''}
        onChange={(description) => {
          updateEncounter({ description });
        }}
        placeholder='Global combat notes...'
      />
    </GlassPanel>
  );
};
