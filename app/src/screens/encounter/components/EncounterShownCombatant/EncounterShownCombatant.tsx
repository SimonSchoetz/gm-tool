import { FCProps } from '@/types/fcProps.type';
import { EncounterCombatantEntityView } from './components/EncounterCombatantEntityView';
import { EncounterCombatantHp } from './components/EncounterCombatantHp';
import { EncounterCombatantNameField } from './components/EncounterCombatantNameField';
import { EncounterCombatantNotes } from './components/EncounterCombatantNotes/EncounterCombatantNotes';
import './EncounterShownCombatant.css';

type Props = { shownItemId: string | null };

export const EncounterShownCombatant: FCProps<Props> = ({ shownItemId }) => {
  if (shownItemId === null) {
    return (
      <p className='encounter-shown-combatant-hint'>
        Click a combatant in the queue to show it here.
      </p>
    );
  }

  return (
    <div className='encounter-shown-combatant'>
      <EncounterCombatantNameField
        key={shownItemId}
        shownItemId={shownItemId}
      />
      <EncounterCombatantHp key={shownItemId} shownItemId={shownItemId} />
      <EncounterCombatantNotes key={shownItemId} shownItemId={shownItemId} />
      <EncounterCombatantEntityView
        key={shownItemId}
        shownItemId={shownItemId}
      />
    </div>
  );
};
