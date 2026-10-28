export const deriveCombatState = (
  items: { id: string; startingMaxHp: number | null }[],
): Map<
  string,
  { maxHp: number | null; currentHp: number | null; tempHp: number }
> =>
  new Map(
    items.map((item) => [
      item.id,
      { maxHp: item.startingMaxHp, currentHp: item.startingMaxHp, tempHp: 0 },
    ]),
  );
