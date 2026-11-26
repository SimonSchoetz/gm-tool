import type { PlanRow } from './planGroupAction';

type DefeatedAction = {
  kind: 'defeated' | 'undefeated';
  label: 'Mark defeated' | 'Unmark defeated';
};

export const pickDefeatedAction = (planRows: PlanRow[]): DefeatedAction => {
  const combatantRows = planRows.filter((row) => row.kind === 'combatant');
  // `every` holds for no rows at all, so the length check keeps a selection of events alone on Mark defeated.
  return combatantRows.length > 0 && combatantRows.every((row) => row.defeated)
    ? { kind: 'undefeated', label: 'Unmark defeated' }
    : { kind: 'defeated', label: 'Mark defeated' };
};
