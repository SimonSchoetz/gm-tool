import { useParams } from '@tanstack/react-router';
import { normalizeQueueItemName, UNNAMED_EVENT_LABEL } from '@domain';
import { Input } from '@/components/Input/Input';
import { useEncounterQueueItems } from '@/data-access-layer';
import { useSyncedInputValue } from '@/hooks/useSyncedInputValue';
import { useTypographicInput } from '@/hooks/useTypographicInput';
import { FCProps } from '@/types/fcProps.type';

type Props = { shownItemId: string };

export const EncounterEventNameField: FCProps<Props> = ({ shownItemId }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  // The stored name, not the entry's shown name: a blank name shows as the fallback in the queue, but the field holds what the GM typed.
  const { queueItems, updateQueueItem } = useEncounterQueueItems(encounterId);
  const item =
    queueItems.find((queueItem) => queueItem.id === shownItemId) ?? null;
  // Stryker disable next-line StringLiteral: the field renders nothing while the item is null, so the empty string is never shown
  const { value, setValue, focusProps } = useSyncedInputValue(item?.name ?? '');
  const { inputRef, handleChange } = useTypographicInput((typed) => {
    setValue(typed);
    updateQueueItem(shownItemId, { name: normalizeQueueItemName(typed) });
  });

  if (item === null) return;

  // The fallback is a placeholder, never the field's text: putting it in as text would store `Untitled Eventx` on the next keystroke. Blur restores nothing.
  return (
    <Input
      ref={inputRef}
      className='encounter-shown-item-name-field'
      aria-label='Event name'
      placeholder={UNNAMED_EVENT_LABEL}
      value={value}
      onChange={handleChange}
      onFocus={focusProps.onFocus}
      onBlur={focusProps.onBlur}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
};
