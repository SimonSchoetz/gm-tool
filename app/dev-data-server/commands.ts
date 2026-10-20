// Node host — imported by vitePlugin.ts: the server-side answer to every `invoke` the browser forwards in web mode, one case per Tauri command of app/src-tauri/src/lib.rs.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { DEV_DATA_SERVER_PREFIX, DEV_DATA_SERVER_ROUTES } from './protocol';
import {
  isFixturePath,
  isSafeImageFileName,
  requestRejectionError,
} from './requestGuard';
import type { SqliteDatabase } from './sqliteDatabase';

export type CommandContext = {
  db: SqliteDatabase;
  imagesDir: string;
  fixturePaths: readonly string[];
};

export const WEB_MODE_PAIRING_CODE = '123456';
// The shape of a device id (domain/devices/identity.ts) that no real endpoint has, for a copy whose _system table holds no device row yet.
const WEB_MODE_DEVICE_ID = '0'.repeat(64);
// Mirrors the `_system` key `db/_system/device.ts` passes to `get`, which cannot be imported here: it reaches `@platform` through `db/database.ts`, an alias Vite's config bundle does not resolve.
const DEVICE_SYSTEM_KEY = 'device';

const deviceValueSchema = z.object({ id: z.string() });

const stringArgument = (
  args: Record<string, unknown>,
  name: string,
): string => {
  const value = args[name];
  if (typeof value !== 'string') {
    throw requestRejectionError(400, `${name} must be a string`);
  }
  return value;
};

// The one place an image command's `id` and `extension` become a file: the name is checked against the safe pattern before it is joined to the images directory.
const imageFile = (
  args: Record<string, unknown>,
  context: CommandContext,
): { name: string; path: string } => {
  const name = `${stringArgument(args, 'id')}.${stringArgument(args, 'extension')}`;
  if (!isSafeImageFileName(name)) {
    throw requestRejectionError(400, `Unsafe image file name: ${name}`);
  }
  return { name, path: join(context.imagesDir, name) };
};

export const answerCommand = async (
  command: string,
  args: Record<string, unknown>,
  context: CommandContext,
): Promise<unknown> => {
  switch (command) {
    case 'save_image': {
      const { path } = imageFile(args, context);
      if (!isFixturePath(args.sourcePath, context.fixturePaths)) {
        throw requestRejectionError(
          400,
          'sourcePath must be one of the fixture images the dialog offers',
        );
      }
      mkdirSync(context.imagesDir, { recursive: true });
      copyFileSync(args.sourcePath, path);
      return statSync(path).size;
    }
    case 'get_image_url': {
      const { name } = imageFile(args, context);
      return `${DEV_DATA_SERVER_PREFIX}${DEV_DATA_SERVER_ROUTES.images}${name}`;
    }
    case 'save_image_bytes': {
      const { path } = imageFile(args, context);
      const dataBase64 = stringArgument(args, 'dataBase64');
      mkdirSync(context.imagesDir, { recursive: true });
      writeFileSync(path, Buffer.from(dataBase64, 'base64'));
      return null;
    }
    case 'read_image_bytes': {
      const { path } = imageFile(args, context);
      return readFileSync(path).toString('base64');
    }
    case 'delete_image': {
      const { path } = imageFile(args, context);
      rmSync(path, { force: true });
      return null;
    }
    case 'check_image_file_exists': {
      const { path } = imageFile(args, context);
      return existsSync(path);
    }
    case 'init_connectivity': {
      const rows = await context.db.select<{ value: string | null }[]>(
        'SELECT value FROM _system WHERE id = $1',
        [DEVICE_SYSTEM_KEY],
      );
      const raw = rows[0]?.value ?? null;
      if (raw === null) return WEB_MODE_DEVICE_ID;
      return deviceValueSchema.parse(JSON.parse(raw)).id;
    }
    case 'get_connected_peers':
      return [];
    case 'enter_pairing_mode':
      return WEB_MODE_PAIRING_CODE;
    case 'exit_pairing_mode':
    case 'submit_pairing_code':
    case 'request_pairing_code':
    case 'send_message':
    case 'remove_trusted_peer':
    case 'update_own_name':
    case 'check_update':
      return null;
    case 'download_update':
    case 'install_and_relaunch':
    case 'prepare_database_backup':
    case 'finish_database_backup':
    case 'prune_database_backups':
      throw new Error(`${command} is not available in web mode`);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
};
