export const itemKeys = {
  list: (adventureId: string) => ['items', adventureId] as const,
  detail: (itemId: string) => ['item', itemId] as const,
};
