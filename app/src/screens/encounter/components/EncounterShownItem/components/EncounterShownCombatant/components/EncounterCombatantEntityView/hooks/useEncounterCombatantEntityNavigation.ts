import { useContext } from 'react';
import { EncounterCombatantEntityNavigationContext } from '../EncounterCombatantEntityNavigationContext';

export const useEncounterCombatantEntityNavigation = () => {
  const onNavigate = useContext(EncounterCombatantEntityNavigationContext);
  if (onNavigate === null) {
    throw new Error(
      'useEncounterCombatantEntityNavigation must be called within an EncounterCombatantEntityView',
    );
  }
  return onNavigate;
};
