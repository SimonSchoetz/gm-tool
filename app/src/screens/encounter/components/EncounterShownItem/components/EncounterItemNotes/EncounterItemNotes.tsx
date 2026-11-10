import { useParams } from '@tanstack/react-router';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { TextEditor } from '@/components/TextEditor';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import './EncounterItemNotes.css';

type Props = { shownItemId: string; placeholder: string };

export const EncounterItemNotes: FCProps<Props> = ({
  shownItemId,
  placeholder,
}) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { queueItems, updateQueueItem } = useEncounterQueueItems(encounterId);
  const item =
    queueItems.find((queueItem) => queueItem.id === shownItemId) ?? null;

  if (item === null) return;

  const onNotesChange = (notes: string) => {
    updateQueueItem(item.id, { notes });
  };

  return (
    <GlassPanel intensity='bright' className='encounter-item-notes'>
      <TextEditor
        placeholder={placeholder}
        textEditorId={`ENCOUNTER_QUEUE_ITEM_${item.id}_notes`}
        value={item.notes ?? ''}
        onChange={onNotesChange}
      />
    </GlassPanel>
  );
};
