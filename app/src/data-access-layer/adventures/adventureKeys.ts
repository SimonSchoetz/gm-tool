export const adventureKeys = {
  list: () => ['adventures'] as const,
  detail: (adventureId: string) => ['adventure', adventureId] as const,
};
