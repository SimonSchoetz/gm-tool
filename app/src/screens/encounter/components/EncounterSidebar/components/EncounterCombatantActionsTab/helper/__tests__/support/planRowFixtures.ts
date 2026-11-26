export const combatantRow = (
  id: string,
  overrides: Partial<{
    amount: number | null;
    hasHp: boolean;
    defeated: boolean;
  }> = {},
) => ({
  kind: 'combatant' as const,
  id,
  amount: 5,
  hasHp: true,
  defeated: false,
  ...overrides,
});

export const eventRow = (id: string) => ({ kind: 'event' as const, id });
