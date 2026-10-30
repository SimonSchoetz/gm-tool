// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { runMigrations } from '../../db/_migrations';
import {
  openTestDatabase,
  skipBackup,
  type TestDatabase,
} from '../../db/__tests__/support/sqlite-test-database';
import { runSeed } from '../seed/seed';

// The seed's own Vite server aliases `@platform` to seedPlatform.ts (seedDatabase.ts); this mock gives the db code the seed reaches the same module.
vi.mock('@platform', () => import('../seed/seedPlatform'));

type BaseEntityRow = { id: string; entity_type: string; name: string | null };
type SectionRow = { type: string; content: string | null };

let db: TestDatabase;

const baseEntityNamed = async (name: string): Promise<BaseEntityRow> => {
  const rows = await db.select<BaseEntityRow[]>(
    'SELECT id, entity_type, name FROM base_entities WHERE name = $1',
    [name],
  );
  const row = rows.at(0) ?? null;
  if (row === null) throw new Error(`No base entity named ${name}`);
  return row;
};

const sectionsOf = async (name: string): Promise<SectionRow[]> =>
  db.select<SectionRow[]>(
    'SELECT type, content FROM base_entity_content_sections WHERE base_entity_id = $1 ORDER BY sort_order',
    [(await baseEntityNamed(name)).id],
  );

type StatBlockContent = {
  basicStatBlock?: { hp: unknown };
  fiveEStatBlock?: { hp: unknown };
};

const hpOf = (section: SectionRow): unknown => {
  const content = JSON.parse(String(section.content)) as StatBlockContent;
  return (content.basicStatBlock ?? content.fiveEStatBlock)?.hp;
};

// The seed runs once, on a fresh database migrated the way vitePlugin.ts migrates it, because db/database.ts caches the first database it loads.
beforeAll(async () => {
  db = openTestDatabase();
  await runMigrations(db, skipBackup);
  await runSeed(db);
});

describe('runSeed', () => {
  it('creates one adventure, Seed Adventure, holding every seeded base entity', async () => {
    const adventures = await db.select<{ id: string; name: string }[]>(
      'SELECT id, name FROM adventures',
    );
    expect(adventures.map(({ name }) => name)).toEqual(['Seed Adventure']);

    const baseEntities = await db.select<
      { entity_type: string; name: string | null; adventure_id: string }[]
    >(
      'SELECT entity_type, name, adventure_id FROM base_entities ORDER BY entity_type, name',
    );
    expect(baseEntities).toEqual(
      [
        { entity_type: 'factions', name: 'Seed Faction' },
        { entity_type: 'foes', name: 'No Stat Block Foe' },
        { entity_type: 'foes', name: 'Single Stat Block Foe' },
        { entity_type: 'foes', name: 'Two Stat Block Foe' },
        { entity_type: 'items', name: 'Seed Item' },
        { entity_type: 'locations', name: 'Seed Location' },
        { entity_type: 'npcs', name: null },
        { entity_type: 'npcs', name: 'Seed NPC' },
        { entity_type: 'pcs', name: 'Seed PC' },
      ].map((row) => ({ ...row, adventure_id: adventures[0]?.id })),
    );
  });

  it('gives Single Stat Block Foe one 5e stat block with HP 7', async () => {
    const sections = await sectionsOf('Single Stat Block Foe');

    expect(sections.map(({ type }) => type)).toEqual(['5e-stat-block']);
    expect(hpOf(sections[0])).toBe(7);
  });

  it('gives Two Stat Block Foe a basic stat block with HP 12, then a 5e stat block with HP 30', async () => {
    const sections = await sectionsOf('Two Stat Block Foe');

    expect(sections.map(({ type }) => type)).toEqual([
      'basic-stat-block',
      '5e-stat-block',
    ]);
    expect(sections.map(hpOf)).toEqual([12, 30]);
  });

  it('gives No Stat Block Foe one empty text section and no stat block', async () => {
    expect(await sectionsOf('No Stat Block Foe')).toEqual([
      { type: 'text', content: null },
    ]);
  });

  it('creates Seed Encounter whose queue holds two Single Stat Block Foes, a Two Stat Block Foe, Seed Event, a No Stat Block Foe and Seed Bandit, in that order', async () => {
    const encounters = await db.select<{ id: string; name: string }[]>(
      'SELECT id, name FROM encounters',
    );
    expect(encounters.map(({ name }) => name)).toEqual(['Seed Encounter']);

    const singleId = (await baseEntityNamed('Single Stat Block Foe')).id;
    const twoId = (await baseEntityNamed('Two Stat Block Foe')).id;
    const noneId = (await baseEntityNamed('No Stat Block Foe')).id;
    expect(
      await db.select(
        'SELECT kind, name, base_entity_id, sequence_number, starting_max_hp FROM encounter_queue_items WHERE encounter_id = $1 ORDER BY sort_order',
        [encounters[0]?.id],
      ),
    ).toEqual([
      {
        kind: 'combatant',
        name: 'Single Stat Block Foe',
        base_entity_id: singleId,
        sequence_number: 1,
        starting_max_hp: 7,
      },
      {
        kind: 'combatant',
        name: 'Single Stat Block Foe',
        base_entity_id: singleId,
        sequence_number: 2,
        starting_max_hp: 7,
      },
      {
        kind: 'combatant',
        name: 'Two Stat Block Foe',
        base_entity_id: twoId,
        sequence_number: 1,
        starting_max_hp: null,
      },
      {
        kind: 'event',
        name: 'Seed Event',
        base_entity_id: null,
        sequence_number: null,
        starting_max_hp: null,
      },
      {
        kind: 'combatant',
        name: 'No Stat Block Foe',
        base_entity_id: noneId,
        sequence_number: 1,
        starting_max_hp: null,
      },
      {
        kind: 'combatant',
        name: 'Seed Bandit',
        base_entity_id: null,
        sequence_number: 1,
        starting_max_hp: 9,
      },
    ]);
    // Each of the seed's five add calls logs one `added` entry; nothing else is logged.
    expect(
      await db.select(
        'SELECT kind FROM encounter_log_entries WHERE encounter_id = $1',
        [encounters[0]?.id],
      ),
    ).toEqual(Array.from({ length: 5 }, () => ({ kind: 'added' })));
  });
});
