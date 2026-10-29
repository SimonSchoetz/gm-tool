export const encounterKeys = {
  list: (adventureId: string) => ['encounters', adventureId] as const,
  detail: (encounterId: string) => ['encounter', encounterId] as const,
  // Must not start with the bare element 'encounter': every notes autosave invalidates the detail key ['encounter', id] as a prefix, so a key of the form ['encounter', id, …] would refetch the queue on every notes save.
  queueItems: (encounterId: string) =>
    ['encounter-queue-items', encounterId] as const,
  logEntries: (encounterId: string) =>
    ['encounter-log-entries', encounterId] as const,
  addCombatants: (encounterId: string) =>
    ['encounter-add-combatants', encounterId] as const,
};
