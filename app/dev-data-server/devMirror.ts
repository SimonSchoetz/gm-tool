// Node host — `node` loads it directly in the first half of the `dev` script, so its relative imports carry the `.ts` extension Node's type stripping requires.
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATABASE_FILE, DEVICE_SYSTEM_KEY } from '../domain/database/index.ts';
import {
  copyDatabase,
  copyImages,
  hasInstalledAppData,
} from './installedAppData.ts';

type MirrorOutcome = 'mirrored' | 'no-installed-data';

type PreservedSet = {
  table: string;
  deleteStagedRows: string;
  copyDevRows: (columns: string) => string;
  params: string[];
};

const DEV_SCHEMA = 'dev';

// The dev app's own identity: its paired devices, their sync cursors and its device row. Every other table follows the release data. Each set carries fixed statements, so only the quoted column list, which skews between schemas and is read through pragma_table_info, and the module constant DEV_SCHEMA are built into SQL.
const PRESERVED_SETS: readonly PreservedSet[] = [
  {
    table: 'paired_devices',
    deleteStagedRows: 'DELETE FROM main.paired_devices',
    copyDevRows: (columns) =>
      `INSERT INTO main.paired_devices (${columns}) SELECT ${columns} FROM ${DEV_SCHEMA}.paired_devices`,
    params: [],
  },
  {
    table: '_sync_peers',
    deleteStagedRows: 'DELETE FROM main._sync_peers',
    copyDevRows: (columns) =>
      `INSERT INTO main._sync_peers (${columns}) SELECT ${columns} FROM ${DEV_SCHEMA}._sync_peers`,
    params: [],
  },
  {
    table: '_system',
    deleteStagedRows: 'DELETE FROM main._system WHERE id = ?',
    copyDevRows: (columns) =>
      `INSERT INTO main._system (${columns}) SELECT ${columns} FROM ${DEV_SCHEMA}._system WHERE id = ?`,
    params: [DEVICE_SYSTEM_KEY],
  },
];

const STAGING_DIR_NAME = '.mirror-staging';

const quoteIdentifier = (name: string): string =>
  `"${name.replaceAll('"', '""')}"`;

const columnNames = (
  db: DatabaseSync,
  table: string,
  schema: string,
): string[] =>
  db
    .prepare('SELECT name FROM pragma_table_info(?, ?)')
    .all(table, schema)
    .flatMap(({ name }) => (typeof name === 'string' ? [name] : []));

const copyDevRows = (db: DatabaseSync, set: PreservedSet): void => {
  const devColumns = columnNames(db, set.table, DEV_SCHEMA);
  const columns = columnNames(db, set.table, 'main')
    .filter((column) => devColumns.includes(column))
    .map(quoteIdentifier)
    .join(', ');
  db.prepare(set.copyDevRows(columns)).run(...set.params);
};

const keepDevIdentity = (stagedPath: string, devPath: string): void => {
  const db = new DatabaseSync(stagedPath);
  try {
    for (const set of PRESERVED_SETS) {
      if (columnNames(db, set.table, 'main').length === 0) {
        throw new Error(
          `The installed app's database lacks the table ${set.table}, so the dev app's own rows in it cannot be kept.`,
        );
      }
      // Deleted whether or not the old dev database has the table: it can lack one, and the release rows must still not survive into the dev app.
      db.prepare(set.deleteStagedRows).run(...set.params);
    }
    if (existsSync(devPath)) {
      // DEV_SCHEMA is a module constant; an attached schema's name cannot be bound.
      db.prepare(`ATTACH DATABASE ? AS ${DEV_SCHEMA}`).run(devPath);
      for (const set of PRESERVED_SETS) {
        if (columnNames(db, set.table, DEV_SCHEMA).length > 0) {
          copyDevRows(db, set);
        }
      }
      // DEV_SCHEMA is a module constant, as at ATTACH above.
      db.exec(`DETACH DATABASE ${DEV_SCHEMA}`);
    }
  } finally {
    // Closing leaves the staged database neither a -wal nor a -shm behind.
    db.close();
  }
};

export const mirrorInstalledData = ({
  sourceDir,
  targetDir,
}: {
  sourceDir: string;
  targetDir: string;
}): MirrorOutcome => {
  // Without this, a tauri.dev.conf.json lacking its `identifier` would make the target the release directory, and the swap below would delete the release data.
  if (resolve(sourceDir) === resolve(targetDir)) {
    throw new Error(
      `The dev data directory ${targetDir} is the installed app's data directory; refusing to replace it.`,
    );
  }
  if (!hasInstalledAppData(sourceDir)) return 'no-installed-data';

  mkdirSync(targetDir, { recursive: true });
  const staging = join(targetDir, STAGING_DIR_NAME);
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging);
  try {
    copyDatabase(sourceDir, staging);
    copyImages(sourceDir, staging);
    keepDevIdentity(
      join(staging, DATABASE_FILE),
      join(targetDir, DATABASE_FILE),
    );
    // Removing gm_tool.db-wal and gm_tool.db-shm with the main file keeps a stale log from being replayed under the new database.
    for (const name of [
      DATABASE_FILE,
      `${DATABASE_FILE}-wal`,
      `${DATABASE_FILE}-shm`,
      'images',
    ]) {
      rmSync(join(targetDir, name), { recursive: true, force: true });
    }
    renameSync(join(staging, DATABASE_FILE), join(targetDir, DATABASE_FILE));
    renameSync(join(staging, 'images'), join(targetDir, 'images'));
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
  return 'mirrored';
};
