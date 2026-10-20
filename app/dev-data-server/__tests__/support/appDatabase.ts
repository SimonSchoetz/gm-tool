import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { SQLOutputValue } from 'node:sqlite';
import { INSTALLED_DATABASE_FILE } from '../../installedAppData';

type AppDatabaseOptions = {
  notes?: { id: string; body: string }[];
  pairedDevices?: { id: string; name: string }[];
  syncPeers?: { id: string; lastReceivedSeq: number }[];
  system?: { id: string; value: string }[];
  omitPairedDevices?: boolean;
  pairedDevicesExtraColumn?: boolean;
};

const FIXED_TIMESTAMP = '2026-10-20T00:00:00.000Z';

// Writes `<dir>/gm_tool.db` as a closed database (no -wal) holding the tables the mirror reads: `notes` stands for every content table, the other three are the tables whose rows the dev app keeps across a mirror.
export const writeAppDatabase = (
  dir: string,
  {
    notes = [],
    pairedDevices = [],
    syncPeers = [],
    system = [],
    omitPairedDevices = false,
    pairedDevicesExtraColumn = false,
  }: AppDatabaseOptions = {},
): void => {
  const db = new DatabaseSync(join(dir, INSTALLED_DATABASE_FILE));
  db.exec(`
    CREATE TABLE notes (id TEXT PRIMARY KEY, body TEXT);
    CREATE TABLE _sync_peers (id TEXT PRIMARY KEY, last_received_seq INTEGER);
    CREATE TABLE _system (id TEXT PRIMARY KEY, value TEXT);
  `);
  for (const { id, body } of notes) {
    db.prepare('INSERT INTO notes (id, body) VALUES (?, ?)').run(id, body);
  }
  for (const { id, lastReceivedSeq } of syncPeers) {
    db.prepare(
      'INSERT INTO _sync_peers (id, last_received_seq) VALUES (?, ?)',
    ).run(id, lastReceivedSeq);
  }
  for (const { id, value } of system) {
    db.prepare('INSERT INTO _system (id, value) VALUES (?, ?)').run(id, value);
  }
  if (!omitPairedDevices) {
    db.exec(
      pairedDevicesExtraColumn
        ? 'CREATE TABLE paired_devices (id TEXT PRIMARY KEY, name TEXT, created_at TEXT, updated_at TEXT, extra TEXT)'
        : 'CREATE TABLE paired_devices (id TEXT PRIMARY KEY, name TEXT, created_at TEXT, updated_at TEXT)',
    );
    for (const { id, name } of pairedDevices) {
      db.prepare(
        'INSERT INTO paired_devices (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      ).run(id, name, FIXED_TIMESTAMP, FIXED_TIMESTAMP);
    }
  }
  db.close();
};

export const readAppDatabaseRows = (
  dir: string,
  sql: string,
): Record<string, SQLOutputValue>[] => {
  const db = new DatabaseSync(join(dir, INSTALLED_DATABASE_FILE));
  try {
    return db.prepare(sql).all();
  } finally {
    db.close();
  }
};
