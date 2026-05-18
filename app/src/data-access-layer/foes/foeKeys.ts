export const foeKeys = {
  list: (adventureId: string) => ['foes', adventureId] as const,
  detail: (foeId: string) => ['foe', foeId] as const,
};
