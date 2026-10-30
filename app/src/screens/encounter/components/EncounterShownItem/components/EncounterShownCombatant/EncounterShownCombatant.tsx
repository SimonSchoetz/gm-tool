import { FCProps } from '@/types/fcProps.type';
import { EncounterItemNotes } from '../EncounterItemNotes/EncounterItemNotes';
import { EncounterCombatantEntityView } from './components/EncounterCombatantEntityView';
import { EncounterCombatantHp } from './components/EncounterCombatantHp';
import { EncounterCombatantNameField } from './components/EncounterCombatantNameField';

type Props = { shownItemId: string };

export const EncounterShownCombatant: FCProps<Props> = ({ shownItemId }) => (
  <>
    <EncounterCombatantNameField shownItemId={shownItemId} />
    <EncounterCombatantHp shownItemId={shownItemId} />
    <EncounterItemNotes
      shownItemId={shownItemId}
      placeholder='Combatant notes...'
    />
    <EncounterCombatantEntityView shownItemId={shownItemId} />
  </>
);
