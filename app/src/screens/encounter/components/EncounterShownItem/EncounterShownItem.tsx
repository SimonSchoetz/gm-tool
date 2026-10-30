import { FCProps } from '@/types/fcProps.type';
import { useEncounterQueueEntry } from '../../hooks/useEncounterQueueEntry';
import { EncounterShownCombatant } from './components/EncounterShownCombatant';
import { EncounterShownEvent } from './components/EncounterShownEvent';
import './EncounterShownItem.css';

type Props = { shownItemId: string | null };

export const EncounterShownItem: FCProps<Props> = ({ shownItemId }) => {
  // An empty id matches no entry: hooks never run conditionally.
  // Stryker disable next-line StringLiteral: with a null id the component returns the hint before it reads the entry, so no id string changes the output
  const entry = useEncounterQueueEntry(shownItemId ?? '');

  if (shownItemId === null) {
    return (
      <p className='encounter-shown-item-hint'>
        Click an entry in the queue to show it here.
      </p>
    );
  }

  if (entry === null) return;

  return (
    <div key={shownItemId} className='encounter-shown-item'>
      {entry.kind === 'event' ? (
        <EncounterShownEvent shownItemId={shownItemId} />
      ) : (
        <EncounterShownCombatant shownItemId={shownItemId} />
      )}
    </div>
  );
};
