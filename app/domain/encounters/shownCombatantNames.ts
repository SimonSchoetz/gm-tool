const UNTITLED_COMBATANT_NAME = 'Untitled Combatant';

type NamedItem = {
  id: string;
  baseEntityId: string | null;
  name: string | null;
  sequenceNumber: number | null;
};

export const shownCombatantNames = (
  items: NamedItem[],
  entityNamesById: Map<string, string | null>,
): Map<string, string> => {
  // An entity id absent from the map is not linked: while the entity lists refetch after an entity delete, a combatant whose entity is already gone must show its stored name, and treating it as linked would show "Untitled Combatant" instead.
  const isLinked = (
    item: NamedItem,
  ): item is NamedItem & { baseEntityId: string } =>
    item.baseEntityId !== null && entityNamesById.has(item.baseEntityId);

  const baseName = (item: NamedItem): string =>
    (isLinked(item)
      ? (entityNamesById.get(item.baseEntityId) ?? null)
      : item.name) ?? UNTITLED_COMBATANT_NAME;

  const numberingKey = (item: NamedItem): string =>
    JSON.stringify(
      isLinked(item) ? ['entity', item.baseEntityId] : ['name', item.name],
    );

  const itemsPerKey = new Map<string, number>();
  for (const item of items) {
    const key = numberingKey(item);
    itemsPerKey.set(key, (itemsPerKey.get(key) ?? 0) + 1);
  }

  return new Map(
    items.map((item) => {
      const isShared = (itemsPerKey.get(numberingKey(item)) ?? 0) >= 2;
      const name = baseName(item);
      return [
        item.id,
        isShared && item.sequenceNumber !== null
          ? `${name} ${item.sequenceNumber}`
          : name,
      ];
    }),
  );
};
