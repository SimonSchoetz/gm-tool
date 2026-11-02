// @vitest-environment node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { runMigrations } from '../../../db/_migrations';
import {
  openTestDatabase,
  skipBackup,
  type TestDatabase,
} from '../../../db/__tests__/support/sqlite-test-database';
import { createTempDirectory } from '../../__tests__/support/tempDirectory';
import { readFixturePaths } from '../../fixtureCycle';
import { runSeed } from '../seed';

// The seed's own Vite server aliases `@platform` to seedPlatform.ts (seedDatabase.ts); this mock gives the db code the seed reaches the same module.
vi.mock('@platform', () => import('../seedPlatform'));

type BaseEntityRow = { id: string; entity_type: string; name: string | null };
type SectionRow = { type: string; content: string | null };

let db: TestDatabase;
let imagesDirectory: ReturnType<typeof createTempDirectory>;

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
  imagesDirectory = createTempDirectory();
  await runMigrations(db, skipBackup);
  await runSeed({
    db,
    imagesDir: imagesDirectory.dir,
    fixturePaths: readFixturePaths(),
  });
});

afterAll(() => {
  imagesDirectory.remove();
});

type ImageRow = {
  id: string;
  file_extension: string;
  original_filename: string;
};

// Each seeded row's name with its image's original file name, or null for a row without an image.
const imagesOf = async (
  table: 'adventures' | 'base_entities' | 'encounters',
): Promise<{ name: string | null; original_filename: string | null }[]> =>
  db.select(
    // `table` comes only from the fixed union in this function's signature.
    `SELECT t.name, i.original_filename FROM ${table} t LEFT JOIN images i ON i.id = t.image_id ORDER BY t.name`,
  );

describe('runSeed', () => {
  it('creates Seed Adventure, holding every seeded base entity, and an empty Imageless Adventure', async () => {
    const adventures = await db.select<{ id: string; name: string }[]>(
      'SELECT id, name FROM adventures',
    );
    expect(adventures.map(({ name }) => name).sort()).toEqual([
      'Imageless Adventure',
      'Seed Adventure',
    ]);
    const seedAdventureId = adventures.find(
      ({ name }) => name === 'Seed Adventure',
    )?.id;

    const baseEntities = await db.select<
      { entity_type: string; name: string | null; adventure_id: string }[]
    >(
      'SELECT entity_type, name, adventure_id FROM base_entities ORDER BY entity_type, name',
    );
    expect(baseEntities).toEqual(
      [
        { entity_type: 'factions', name: 'Imageless Faction' },
        { entity_type: 'factions', name: 'Seed Faction' },
        { entity_type: 'foes', name: 'No Stat Block Foe' },
        { entity_type: 'foes', name: 'Single Stat Block Foe' },
        { entity_type: 'foes', name: 'Two Stat Block Foe' },
        { entity_type: 'items', name: 'Imageless Item' },
        { entity_type: 'items', name: 'Seed Item' },
        { entity_type: 'locations', name: 'Imageless Location' },
        { entity_type: 'locations', name: 'Seed Location' },
        { entity_type: 'npcs', name: null },
        { entity_type: 'npcs', name: 'Seed NPC' },
        { entity_type: 'pcs', name: 'Imageless PC' },
        { entity_type: 'pcs', name: 'Seed PC' },
      ].map((row) => ({ ...row, adventure_id: seedAdventureId })),
    );
  });

  it('gives Seed Adventure the landscape fixture and Imageless Adventure no image', async () => {
    expect(await imagesOf('adventures')).toEqual([
      { name: 'Imageless Adventure', original_filename: null },
      { name: 'Seed Adventure', original_filename: 'landscape.png' },
    ]);
  });

  it('gives one base entity of each type a fixture image and leaves another of the same type without one', async () => {
    expect(await imagesOf('base_entities')).toEqual([
      { name: null, original_filename: null },
      { name: 'Imageless Faction', original_filename: null },
      { name: 'Imageless Item', original_filename: null },
      { name: 'Imageless Location', original_filename: null },
      { name: 'Imageless PC', original_filename: null },
      { name: 'No Stat Block Foe', original_filename: null },
      { name: 'Seed Faction', original_filename: 'square.webp' },
      { name: 'Seed Item', original_filename: 'square.webp' },
      { name: 'Seed Location', original_filename: 'landscape.png' },
      { name: 'Seed NPC', original_filename: 'portrait.jpg' },
      { name: 'Seed PC', original_filename: 'portrait.jpg' },
      { name: 'Single Stat Block Foe', original_filename: 'square.webp' },
      { name: 'Two Stat Block Foe', original_filename: null },
    ]);
  });

  it('gives Seed Encounter the landscape fixture and Imageless Encounter no image', async () => {
    expect(await imagesOf('encounters')).toEqual([
      { name: 'Imageless Encounter', original_filename: null },
      { name: 'Seed Encounter', original_filename: 'landscape.png' },
    ]);
  });

  it('stores the file of every seeded image in the images folder', async () => {
    const images = await db.select<ImageRow[]>(
      'SELECT id, file_extension, original_filename FROM images',
    );

    expect(images).toHaveLength(8);
    for (const { id, file_extension } of images) {
      expect(
        existsSync(join(imagesDirectory.dir, `${id}.${file_extension}`)),
      ).toBe(true);
    }
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
      "SELECT id, name FROM encounters WHERE name = 'Seed Encounter'",
    );

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

  it('rejects naming a missing fixture image before writing any row', async () => {
    const adventureCount = async () =>
      (await db.select<unknown[]>('SELECT id FROM adventures')).length;
    const before = await adventureCount();

    await expect(
      runSeed({
        db,
        imagesDir: imagesDirectory.dir,
        fixturePaths: readFixturePaths().filter(
          (path) => !path.endsWith('square.webp'),
        ),
      }),
    ).rejects.toThrow(/^The seed found no fixture image named square\.webp\.$/);
    expect(await adventureCount()).toBe(before);
  });
});
