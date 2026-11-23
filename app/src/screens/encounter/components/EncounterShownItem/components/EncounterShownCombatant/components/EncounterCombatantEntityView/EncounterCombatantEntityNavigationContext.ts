import { createContext } from 'react';

// Opens the shown combatant's entity screen; the entity view provides it so its header, which `EntityReadOnlyView` renders, can offer the jump.
export const EncounterCombatantEntityNavigationContext = createContext<
  (() => void) | null
>(null);
