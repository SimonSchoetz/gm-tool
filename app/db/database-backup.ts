import { invoke } from '@tauri-apps/api/core';
import type Database from '@tauri-apps/plugin-sql';

// Copies the database file next to itself before pending migrations change it, named for the ledger head the copy holds. `VACUUM INTO` is the copy because the database runs in WAL mode: while plugin-sql's pool holds it open, committed rows can sit in the `-wal` file the main file lacks, and `VACUUM INTO` writes a consistent single-file snapshot of both. The backend owns the backup file names and keeps only the newest copies (`app/src-tauri/src/commands/database_backup/`), since the webview has no filesystem access.
export const backupDatabase = async (
  db: Database,
  databaseFile: string,
  ledgerHead: string | null,
): Promise<void> => {
  // No migration has completed on a database with an empty ledger, so it holds no user data to protect.
  if (ledgerHead === null) return;

  const stagingPath = await invoke<string | null>('prepare_database_backup', {
    databaseFile,
    ledgerHead,
  });
  // A finished backup at this ledger head was taken before an earlier attempt at the same pending migrations, so it is kept as it is.
  if (stagingPath === null) return;

  await db.execute('VACUUM INTO $1', [stagingPath]);
  await invoke('finish_database_backup', { databaseFile, ledgerHead });
  try {
    await invoke('prune_database_backups', { databaseFile, ledgerHead });
  } catch (error) {
    // The backup is already finished, so a failed cleanup must not keep the migrations, and with them the app, from running; the next backup prunes again.
    console.error('Pruning old database backups failed:', error);
  }
};
