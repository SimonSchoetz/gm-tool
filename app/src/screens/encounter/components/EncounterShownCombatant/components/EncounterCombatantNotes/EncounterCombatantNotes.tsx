import { useParams } from '@tanstack/react-router';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { TextEditor } from '@/components/TextEditor';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import './EncounterCombatantNotes.css';

type Props = { shownItemId: string };

export const EncounterCombatantNotes: FCProps<Props> = ({ shownItemId }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { queueItems, updateQueueItem } = useEncounterQueueItems(encounterId);
  const item =
    queueItems.find((queueItem) => queueItem.id === shownItemId) ?? null;

  if (item === null) return;

  return (
    <GlassPanel intensity='bright' className='encounter-combatant-notes'>
      <TextEditor
        placeholder='Combatant notes...'
        textEditorId={`ENCOUNTER_QUEUE_ITEM_${item.id}_notes`}
        value={item.notes ?? ''}
        onChange={(notes) => {
          updateQueueItem(item.id, { notes });
        }}
      />
    </GlassPanel>
  );
};
