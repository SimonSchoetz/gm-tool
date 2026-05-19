export const pcKeys = {
  list: (adventureId: string) => ['pcs', adventureId] as const,
  detail: (pcId: string) => ['pc', pcId] as const,
};
