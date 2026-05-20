export const factionKeys = {
  list: (adventureId: string) => ['factions', adventureId] as const,
  detail: (factionId: string) => ['faction', factionId] as const,
};
