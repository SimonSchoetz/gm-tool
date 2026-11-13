// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const createAdventure = async () => {
  const { create } = await import('@db/adventure');
  return create();
};

// Pins are set through each module's own update, so the reads under test do not depend on the writer under test.
const addNpc = async (adventureId: string, pinnedOrder: number | null) => {
  const { create, update } = await import('@db/base-entity');
  const id = await create('npcs', adventureId);
  if (pinnedOrder !== null) await update(id, { pinned_order: pinnedOrder });
  return id;
};

const addPc = async (adventureId: string, pinnedOrder: number) => {
  const { create, update } = await import('@db/base-entity');
  const id = await create('pcs', adventureId);
  await update(id, { pinned_order: pinnedOrder });
  return id;
};

const addSession = async (adventureId: string, pinnedOrder: number | null) => {
  const { create, update } = await import('@db/session');
  const id = await create(adventureId);
  if (pinnedOrder !== null) await update(id, { pinned_order: pinnedOrder });
  return id;
};

const readUpdatedAts = async (table: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<{ id: string; updated_at: string }[]>(
    `SELECT id, updated_at FROM ${table} ORDER BY rowid`,
  );
};

const readPinnedOrders = async (table: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<{ id: string; pinned_order: number | null }[]>(
    `SELECT id, pinned_order FROM ${table} ORDER BY rowid`,
  );
};

describe('pinned order', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('getMaxPinnedOrder', () => {
    it("returns the highest pin among the entity's adventure's pinned entities of its type", async () => {
      const { getMaxPinnedOrder } = await import('../pinned-order');
      const adventureId = await createAdventure();
      const otherAdventureId = await createAdventure();
      const firstNpc = await addNpc(adventureId, 1);
      await addNpc(adventureId, 3);
      await addNpc(adventureId, null);
      await addPc(adventureId, 9);
      await addNpc(otherAdventureId, 8);

      expect(await getMaxPinnedOrder('npcs', firstNpc)).toBe(3);
    });

    it('returns null when no entity of the type is pinned in the adventure', async () => {
      const { getMaxPinnedOrder } = await import('../pinned-order');
      const adventureId = await createAdventure();
      const npc = await addNpc(adventureId, null);
      await addNpc(adventureId, null);

      expect(await getMaxPinnedOrder('npcs', npc)).toBeNull();
    });

    it("returns the highest pin among the session's adventure's sessions for a non-base type", async () => {
      const { getMaxPinnedOrder } = await import('../pinned-order');
      const adventureId = await createAdventure();
      const otherAdventureId = await createAdventure();
      const firstSession = await addSession(adventureId, 1);
      await addSession(adventureId, 2);
      await addSession(adventureId, null);
      await addSession(otherAdventureId, 7);
      await addNpc(adventureId, 9);

      expect(await getMaxPinnedOrder('sessions', firstSession)).toBe(2);
    });
  });

  describe('setPinnedOrder', () => {
    it('stores a pin on the given entity only and clears it with null', async () => {
      const { setPinnedOrder } = await import('../pinned-order');
      const adventureId = await createAdventure();
      const pinnedNpc = await addNpc(adventureId, null);
      const otherNpc = await addNpc(adventureId, 5);

      await setPinnedOrder('npcs', pinnedNpc, 3);
      expect(await readPinnedOrders('base_entities')).toEqual([
        { id: pinnedNpc, pinned_order: 3 },
        { id: otherNpc, pinned_order: 5 },
      ]);

      await setPinnedOrder('npcs', pinnedNpc, null);
      expect(await readPinnedOrders('base_entities')).toEqual([
        { id: pinnedNpc, pinned_order: null },
        { id: otherNpc, pinned_order: 5 },
      ]);
    });

    it('stores a pin on the given session only', async () => {
      const { setPinnedOrder } = await import('../pinned-order');
      const adventureId = await createAdventure();
      const pinnedSession = await addSession(adventureId, null);
      const otherSession = await addSession(adventureId, 5);

      await setPinnedOrder('sessions', pinnedSession, 2);

      expect(await readPinnedOrders('sessions')).toEqual([
        { id: pinnedSession, pinned_order: 2 },
        { id: otherSession, pinned_order: 5 },
      ]);
    });

    describe('updated_at', () => {
      const CREATED = '2026-01-01T00:00:00.000Z';
      const PINNED = '2026-01-02T00:00:00.000Z';

      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(CREATED));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it.each([
        {
          label: 'a base entity',
          table: 'base_entities',
          add: addNpc,
          type: 'npcs',
        },
        {
          label: 'a session',
          table: 'sessions',
          add: addSession,
          type: 'sessions',
        },
      ])(
        'stamps the pinned and the unpinned $label as updated, and no other row',
        async ({ table, add, type }) => {
          const { setPinnedOrder } = await import('../pinned-order');
          const adventureId = await createAdventure();
          const pinned = await add(adventureId, null);
          const other = await add(adventureId, null);

          vi.setSystemTime(new Date(PINNED));
          await setPinnedOrder(type, pinned, 0);
          expect(await readUpdatedAts(table)).toEqual([
            { id: pinned, updated_at: PINNED },
            { id: other, updated_at: CREATED },
          ]);

          const UNPINNED = '2026-01-03T00:00:00.000Z';
          vi.setSystemTime(new Date(UNPINNED));
          await setPinnedOrder(type, pinned, null);
          expect(await readUpdatedAts(table)).toEqual([
            { id: pinned, updated_at: UNPINNED },
            { id: other, updated_at: CREATED },
          ]);
        },
      );
    });
  });
});
