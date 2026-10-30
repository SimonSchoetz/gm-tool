import { useParams } from '@tanstack/react-router';
import { Input } from '@/components/Input/Input';
import { useEncounterQueueItems } from '@/data-access-layer';
import { useSyncedInputValue } from '@/hooks/useSyncedInputValue';
import { useTypographicInput } from '@/hooks/useTypographicInput';
import { FCProps } from '@/types/fcProps.type';
import { useEncounterQueueEntry } from '../../../../hooks/useEncounterQueueEntry';
import { resolveCustomName } from './helper/resolveCustomName';
import './EncounterCombatantNameField.css';

type Props = { shownItemId: string };

export const EncounterCombatantNameField: FCProps<Props> = ({
  shownItemId,
}) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const entry = useEncounterQueueEntry(shownItemId);
  const { updateQueueItem } = useEncounterQueueItems(encounterId);
  // Stryker disable next-line StringLiteral: the field renders nothing while the entry is null, so the empty string is never shown
  const shownName = entry?.name ?? '';
  // Stryker disable next-line StringLiteral: the field renders nothing while the entry is null, so no typed value reaches the comparison with the empty string
  const automaticName = entry?.automaticName ?? '';
  const { value, setValue, focusProps } = useSyncedInputValue(shownName);
  const { inputRef, handleChange } = useTypographicInput((typed) => {
    setValue(typed);
    updateQueueItem(shownItemId, {
      custom_name: resolveCustomName(typed, automaticName),
    });
  });

  if (entry === null) return;

  return (
    <Input
      ref={inputRef}
      className='encounter-combatant-name-field'
      aria-label='Combatant name'
      value={value}
      onChange={handleChange}
      onFocus={focusProps.onFocus}
      onBlur={() => {
        focusProps.onBlur();
        setValue(shownName);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
};
