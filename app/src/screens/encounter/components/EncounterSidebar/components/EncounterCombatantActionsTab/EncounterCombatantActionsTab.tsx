import { FCProps } from '@/types/fcProps.type';
import { describeQueueEntryHp } from '../../../../helper/describeQueueEntryHp';
import { useEncounterQueueEntries } from '../../../../hooks/useEncounterQueueEntries';
import './EncounterCombatantActionsTab.css';

type Props = { selectedId: string | null };

export const EncounterCombatantActionsTab: FCProps<Props> = ({
  selectedId,
}) => {
  const { entries } = useEncounterQueueEntries();
  const entry =
    entries.find((candidate) => candidate.id === selectedId) ?? null;

  if (!entry) {
    return (
      <div className='encounter-combatant-actions-tab'>
        Select a combatant in the queue.
      </div>
    );
  }

  const hp = describeQueueEntryHp(entry);

  return (
    <div className='encounter-combatant-actions-tab'>
      <div className='encounter-combatant-actions-tab-row'>
        <div className='encounter-combatant-actions-tab-text'>
          <div className='clip-text'>{entry.name}</div>
          <div className='encounter-combatant-actions-tab-hp'>
            {hp ? hp.text : 'HP is not set. Set max HP to track it.'}
          </div>
        </div>
      </div>
    </div>
  );
};
