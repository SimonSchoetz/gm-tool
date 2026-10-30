import type { LogEntryPayload } from '@domain';

type GroupActionKind =
  | 'damage'
  | 'heal'
  | 'temp-hp'
  | 'max-hp'
  | 'defeated'
  | 'undefeated'
  | 'removed';

export type GroupActionPlan = {
  [K in GroupActionKind]: { kind: K; payload: LogEntryPayload<K> };
}[GroupActionKind];

export type PlanRow =
  | { kind: 'event'; id: string }
  | {
      kind: 'combatant';
      id: string;
      amount: number | null;
      hasHp: boolean;
      defeated: boolean;
    };
type CombatantPlanRow = Extract<PlanRow, { kind: 'combatant' }>;

const isCombatantRow = (row: PlanRow): row is CombatantPlanRow =>
  row.kind === 'combatant';

const amountsOf = (
  rows: CombatantPlanRow[],
): { queueItemId: string; amount: number }[] | null => {
  const targets: { queueItemId: string; amount: number }[] = [];
  for (const row of rows) {
    if (row.amount === null) return null;
    targets.push({ queueItemId: row.id, amount: row.amount });
  }
  return targets.length === 0 ? null : targets;
};

const idsOf = (rows: PlanRow[]): string[] | null =>
  rows.length === 0 ? null : rows.map((row) => row.id);

export const planGroupAction = (
  kind: GroupActionKind,
  planRows: PlanRow[],
): GroupActionPlan | null => {
  // An event row takes no amount and no state: every kind but `removed` runs over the combatant rows.
  const rows = planRows.filter(isCombatantRow);
  switch (kind) {
    case 'damage':
    case 'heal': {
      const targets = amountsOf(rows.filter((row) => row.hasHp));
      return targets === null ? null : { kind, payload: { targets } };
    }
    case 'temp-hp':
    case 'max-hp': {
      const amounts = amountsOf(rows);
      return amounts === null
        ? null
        : {
            kind,
            payload: {
              targets: amounts.map(({ queueItemId, amount }) => ({
                queueItemId,
                value: amount,
              })),
            },
          };
    }
    case 'defeated': {
      const queueItemIds = idsOf(rows.filter((row) => !row.defeated));
      return queueItemIds === null ? null : { kind, payload: { queueItemIds } };
    }
    case 'undefeated': {
      const queueItemIds = idsOf(rows.filter((row) => row.defeated));
      return queueItemIds === null ? null : { kind, payload: { queueItemIds } };
    }
    case 'removed': {
      const queueItemIds = idsOf(planRows);
      return queueItemIds === null ? null : { kind, payload: { queueItemIds } };
    }
  }
};
