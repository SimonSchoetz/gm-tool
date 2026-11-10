import { useParams } from '@tanstack/react-router';
import { Input } from '@/components/Input/Input';
import { useEncounterQueueItems } from '@/data-access-layer';
import { useSyncedInputValue } from '@/hooks/useSyncedInputValue';
import { useTypographicInput } from '@/hooks/useTypographicInput';
import { FCProps } from '@/types/fcProps.type';
import { blurOnEnter } from '@/util/blurOnEnter';
import { useEncounterCombatantEntry } from '../../../../../../hooks/useEncounterCombatantEntry';
import { resolveCustomName } from './helper/resolveCustomName';

type Props = { shownItemId: string };

export const EncounterCombatantNameField: FCProps<Props> = ({
  shownItemId,
}) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const entry = useEncounterCombatantEntry(shownItemId);
  const { updateQueueItem } = useEncounterQueueItems(encounterId);
  // The field renders nothing while the entry is null, so neither `''` fallback is shown or compared.
  const shownName = entry?.name ?? '';
  const automaticName = entry?.automaticName ?? '';
  const { value, setValue, focusProps } = useSyncedInputValue(shownName);
  const { inputRef, handleChange } = useTypographicInput((typed) => {
    setValue(typed);
    updateQueueItem(shownItemId, {
      custom_name: resolveCustomName(typed, automaticName),
    });
  });

  if (entry === null) return;

  const onBlur = () => {
    focusProps.onBlur();
    setValue(shownName);
  };

  return (
    <Input
      ref={inputRef}
      className='encounter-shown-item-name-field'
      aria-label='Combatant name'
      value={value}
      onChange={handleChange}
      onFocus={focusProps.onFocus}
      onBlur={onBlur}
      onKeyDown={blurOnEnter}
    />
  );
};
