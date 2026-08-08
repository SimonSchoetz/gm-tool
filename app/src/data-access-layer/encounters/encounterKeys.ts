export const encounterKeys = {
  list: (adventureId: string) => ['encounters', adventureId] as const,
  detail: (encounterId: string) => ['encounter', encounterId] as const,
};
