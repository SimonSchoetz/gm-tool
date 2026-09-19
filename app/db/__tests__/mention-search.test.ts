// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const isoAtMinute = (minute: number) =>
  `2026-01-10T09:${String(minute).padStart(2, '0')}:00.000Z`;

const setMinute = (minute: number) => {
  vi.setSystemTime(new Date(isoAtMinute(minute)));
};

// Names are set through each module's update, so updated_at is the frozen minute of that call. Every matching name has "dra" after its first character, so a prefix-only pattern finds nothing. Within an adventure the NPC created first is also updated first, so the expected most-recently-updated-first order is the reverse of insertion order.
const seedFixture = async () => {
  const { create: createAdventure, update: updateAdventure } =
    await import('@db/adventure');
  const { create: createBaseEntity, update: updateBaseEntity } =
    await import('@db/base-entity');
  const { create: createSession, update: updateSession } =
    await import('@db/session');

  const addAdventure = async (minute: number, name: string) => {
    setMinute(minute);
    const id = await createAdventure();
    await updateAdventure(id, { name });
    return id;
  };
  const addBaseEntity = async (
    minute: number,
    entityType: 'npcs' | 'pcs',
    adventureId: string,
    name: string,
  ) => {
    setMinute(minute);
    const id = await createBaseEntity(entityType, adventureId);
    await updateBaseEntity(id, { name });
    return id;
  };
  const addSession = async (
    minute: number,
    adventureId: string,
    name: string,
  ) => {
    setMinute(minute);
    const id = await createSession(adventureId);
    await updateSession(id, { name });
    return id;
  };

  const adventureA = await addAdventure(1, 'Hydra hunt');
  const adventureB = await addAdventure(2, 'Alexandra saga');
  await addAdventure(3, 'Plain adventure');
  const firstNpcOfA = await addBaseEntity(
    4,
    'npcs',
    adventureA,
    'Hydra of the deep',
  );
  const secondNpcOfA = await addBaseEntity(
    5,
    'npcs',
    adventureA,
    'Alexandra the bold',
  );
  await addBaseEntity(6, 'npcs', adventureA, 'Bob');
  await addBaseEntity(7, 'pcs', adventureA, 'Cassandra');
  const npcOfB = await addBaseEntity(8, 'npcs', adventureB, 'Sandra the sly');
  const sessionOfA = await addSession(9, adventureA, 'Hydra session');
  await addSession(10, adventureB, 'Cassandra session');

  return {
    adventureA,
    adventureB,
    firstNpcOfA,
    secondNpcOfA,
    npcOfB,
    sessionOfA,
  };
};

describe('mention search', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('searchByName', () => {
    it("finds exactly the adventure's matching entities of the type, most recently updated first", async () => {
      const { searchByName } = await import('../mention-search');
      const { adventureA, firstNpcOfA, secondNpcOfA } = await seedFixture();

      expect(await searchByName('npcs', 'dra', adventureA)).toEqual([
        {
          id: secondNpcOfA,
          name: 'Alexandra the bold',
          updated_at: isoAtMinute(5),
        },
        {
          id: firstNpcOfA,
          name: 'Hydra of the deep',
          updated_at: isoAtMinute(4),
        },
      ]);
    });

    it('searches every adventure but only the given entity type when no adventure is given', async () => {
      const { searchByName } = await import('../mention-search');
      const { firstNpcOfA, secondNpcOfA, npcOfB } = await seedFixture();

      const matches = await searchByName('npcs', 'dra', null);

      expect(matches.map((match) => match.id)).toEqual([
        npcOfB,
        secondNpcOfA,
        firstNpcOfA,
      ]);
    });

    it("finds only the adventure's matching sessions for a non-base type", async () => {
      const { searchByName } = await import('../mention-search');
      const { adventureA, sessionOfA } = await seedFixture();

      const matches = await searchByName('sessions', 'dra', adventureA);

      expect(matches.map((match) => match.id)).toEqual([sessionOfA]);
    });

    it('finds matching adventures, most recently updated first, when searching without an adventure', async () => {
      const { searchByName } = await import('../mention-search');
      const { adventureA, adventureB } = await seedFixture();

      const matches = await searchByName('adventures', 'dra', null);

      expect(matches.map((match) => match.id)).toEqual([
        adventureB,
        adventureA,
      ]);
    });

    it('returns no matches for a type that is not an entity type', async () => {
      const { searchByName } = await import('../mention-search');

      expect(await searchByName('images', 'dra', null)).toEqual([]);
    });
  });

  describe('getById', () => {
    it("returns the entity's row under its own type and null under another type or a non-entity table", async () => {
      const { getById } = await import('../mention-search');
      const { firstNpcOfA } = await seedFixture();

      expect(await getById('npcs', firstNpcOfA)).toEqual({
        id: firstNpcOfA,
        name: 'Hydra of the deep',
        updated_at: isoAtMinute(4),
      });
      expect(await getById('pcs', firstNpcOfA)).toBeNull();
      expect(await getById('images', firstNpcOfA)).toBeNull();
    });

    it('returns the row of a non-base entity', async () => {
      const { getById } = await import('../mention-search');
      const { sessionOfA } = await seedFixture();

      expect(await getById('sessions', sessionOfA)).toEqual({
        id: sessionOfA,
        name: 'Hydra session',
        updated_at: isoAtMinute(9),
      });
    });
  });
});
