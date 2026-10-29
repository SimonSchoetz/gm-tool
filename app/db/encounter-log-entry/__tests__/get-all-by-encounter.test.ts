// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const createEncounter = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('@db/encounter');
  return create(await createAdventure());
};

const createEntryAt = async (
  encounterId: string,
  isoInstant: string,
): Promise<string> => {
  const { create } = await import('../create');
  vi.setSystemTime(new Date(isoInstant));
  return create({
    encounter_id: encounterId,
    kind: 'added',
    payload: { queueItemIds: ['a'] },
  });
};

describe('getAllByEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('puts an earlier created_at first although it was inserted later', async () => {
    const { getAllByEncounter } = await import('../get-all-by-encounter');
    const encounterId = await createEncounter();

    const later = await createEntryAt(encounterId, '2026-01-10T10:00:00.000Z');
    const earlier = await createEntryAt(
      encounterId,
      '2026-01-10T09:00:00.000Z',
    );

    expect(
      (await getAllByEncounter(encounterId)).map((entry) => entry.id),
    ).toEqual([earlier, later]);
  });

  it('keeps insertion order for equal created_at, whatever the random ids sort to', async () => {
    const { getAllByEncounter } = await import('../get-all-by-encounter');
    const encounterId = await createEncounter();

    const inserted: string[] = [];
    for (let i = 0; i < 8; i++) {
      inserted.push(
        await createEntryAt(encounterId, '2026-01-10T09:00:00.000Z'),
      );
    }

    expect(
      (await getAllByEncounter(encounterId)).map((entry) => entry.id),
    ).toEqual(inserted);
  });

  it("returns only the given encounter's rows", async () => {
    const { getAllByEncounter } = await import('../get-all-by-encounter');
    const encounterId = await createEncounter();
    const otherEncounterId = await createEncounter();

    const own = await createEntryAt(encounterId, '2026-01-10T09:00:00.000Z');
    await createEntryAt(otherEncounterId, '2026-01-10T09:00:00.000Z');

    expect(
      (await getAllByEncounter(encounterId)).map((entry) => entry.id),
    ).toEqual([own]);
  });

  it('rejects an empty encounter id', async () => {
    const { getAllByEncounter } = await import('../get-all-by-encounter');

    await expect(getAllByEncounter('')).rejects.toThrow(
      /^Valid Encounter ID is required$/,
    );
  });
});
