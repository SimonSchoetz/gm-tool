export const UNNAMED_ENTITY_LABEL = 'Untitled Combatant';

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
  // The map has no null key, so a combatant without a base entity is never linked.
  const namesByEntityId: ReadonlyMap<string | null, string | null> =
    entityNamesById;

  // An entity id absent from the map is not linked: while the entity lists refetch after an entity delete, a combatant whose entity is already gone must show its stored name, and treating it as linked would show "Untitled Combatant" instead.
  const isLinked = (item: NamedItem): boolean =>
    namesByEntityId.has(item.baseEntityId);

  const baseName = (item: NamedItem): string =>
    (isLinked(item)
      ? (namesByEntityId.get(item.baseEntityId) ?? null)
      : item.name) ?? UNNAMED_ENTITY_LABEL;

  const numberingKey = (item: NamedItem): string =>
    JSON.stringify(
      isLinked(item) ? [true, item.baseEntityId] : [false, item.name],
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
