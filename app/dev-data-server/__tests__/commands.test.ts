// @vitest-environment node
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ENDPOINT_ID_HEX_REGEX } from '@domain';
import {
  answerCommand,
  WEB_MODE_PAIRING_CODE,
  type CommandContext,
} from '../commands';
import { DEV_DATA_SERVER_PREFIX, DEV_DATA_SERVER_ROUTES } from '../protocol';
import { isRequestRejectionError } from '../requestGuard';
import { openSqliteDatabase } from '../sqliteDatabase';
import { createTempDirectory } from './support/tempDirectory';

const FIXTURES_DIR = resolve(import.meta.dirname, '../fixtures/images');
const fixturePaths = readdirSync(FIXTURES_DIR)
  .sort()
  .map((name) => join(FIXTURES_DIR, name));
const [landscapePng] = fixturePaths;

let temp: ReturnType<typeof createTempDirectory>;
let context: CommandContext;

beforeEach(async () => {
  temp = createTempDirectory();
  const imagesDir = join(temp.dir, 'images');
  mkdirSync(imagesDir);
  const db = openSqliteDatabase(':memory:');
  await db.execute('CREATE TABLE _system (id TEXT PRIMARY KEY, value TEXT)');
  context = { db, imagesDir, fixturePaths };
});

afterEach(async () => {
  await context.db.close();
  temp.remove();
});

const imageArgs = (id: string, extension = 'png') => ({ id, extension });

describe('answerCommand', () => {
  it('save_image copies a fixture to <id>.<extension> and resolves its byte size', async () => {
    const size = await answerCommand(
      'save_image',
      { ...imageArgs('img1'), sourcePath: landscapePng },
      context,
    );

    expect(size).toBe(statSync(landscapePng).size);
    expect(readFileSync(join(context.imagesDir, 'img1.png'))).toEqual(
      readFileSync(landscapePng),
    );
  });

  it('save_image rejects a source outside the fixtures with status 400, naming sourcePath, and copies nothing', async () => {
    const foreign = join(temp.dir, 'foreign.png');
    writeFileSync(foreign, 'secret');

    await expect(
      answerCommand(
        'save_image',
        { ...imageArgs('img1'), sourcePath: foreign },
        context,
      ),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRequestRejectionError(error) &&
        error.status === 400 &&
        error.message.startsWith('sourcePath '),
    );
    expect(readdirSync(context.imagesDir)).toEqual([]);
  });

  it('rejects an id that would leave the images directory, or is no string, with status 400 and a message naming it', async () => {
    await expect(
      answerCommand('check_image_file_exists', imageArgs('../x'), context),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRequestRejectionError(error) &&
        error.status === 400 &&
        error.message.endsWith(': ../x.png'),
    );
    await expect(
      answerCommand('delete_image', { id: 1, extension: 'png' }, context),
    ).rejects.toSatisfy(
      (error: unknown) =>
        isRequestRejectionError(error) &&
        error.status === 400 &&
        error.message.startsWith('id '),
    );
  });

  it('get_image_url answers the images route for the file', async () => {
    await expect(
      answerCommand('get_image_url', imageArgs('img1', 'webp'), context),
    ).resolves.toBe(
      `${DEV_DATA_SERVER_PREFIX}${DEV_DATA_SERVER_ROUTES.images}img1.webp`,
    );
  });

  it('save_image_bytes then read_image_bytes round-trip the bytes, and a missing file rejects', async () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);

    await expect(
      answerCommand(
        'save_image_bytes',
        { ...imageArgs('img2'), dataBase64: bytes.toString('base64') },
        context,
      ),
    ).resolves.toBeNull();

    expect(readFileSync(join(context.imagesDir, 'img2.png'))).toEqual(bytes);
    await expect(
      answerCommand('read_image_bytes', imageArgs('img2'), context),
    ).resolves.toBe(bytes.toString('base64'));
    await expect(
      answerCommand('read_image_bytes', imageArgs('absent'), context),
    ).rejects.toThrow();
  });

  it('delete_image removes only its file, and succeeds when the file is already gone', async () => {
    writeFileSync(join(context.imagesDir, 'gone.png'), 'gone');
    writeFileSync(join(context.imagesDir, 'kept.png'), 'kept');

    await expect(
      answerCommand('delete_image', imageArgs('gone'), context),
    ).resolves.toBeNull();
    await expect(
      answerCommand('delete_image', imageArgs('gone'), context),
    ).resolves.toBeNull();

    expect(readdirSync(context.imagesDir)).toEqual(['kept.png']);
  });

  it('check_image_file_exists answers for a present and an absent file', async () => {
    writeFileSync(join(context.imagesDir, 'here.jpg'), 'here');

    await expect(
      answerCommand(
        'check_image_file_exists',
        imageArgs('here', 'jpg'),
        context,
      ),
    ).resolves.toBe(true);
    await expect(
      answerCommand(
        'check_image_file_exists',
        imageArgs('there', 'jpg'),
        context,
      ),
    ).resolves.toBe(false);
    expect(existsSync(join(context.imagesDir, 'there.jpg'))).toBe(false);
  });

  it('init_connectivity answers the stored device id, or a well-formed placeholder when no device row exists', async () => {
    const placeholder = await answerCommand('init_connectivity', {}, context);
    expect(placeholder).toMatch(ENDPOINT_ID_HEX_REGEX);

    const storedId = 'ab'.repeat(32);
    await context.db.execute(
      "INSERT INTO _system (id, value) VALUES ('device', $1)",
      [JSON.stringify({ id: storedId, name: 'Desk' })],
    );

    await expect(answerCommand('init_connectivity', {}, context)).resolves.toBe(
      storedId,
    );
  });

  it('answers the connectivity and updater commands with their web-mode constants, the pairing code six digits like the ones the app issues', async () => {
    expect(WEB_MODE_PAIRING_CODE).toMatch(/^\d{6}$/);
    await expect(
      answerCommand('get_connected_peers', {}, context),
    ).resolves.toEqual([]);
    await expect(
      answerCommand('enter_pairing_mode', {}, context),
    ).resolves.toBe(WEB_MODE_PAIRING_CODE);
    for (const command of [
      'exit_pairing_mode',
      'submit_pairing_code',
      'request_pairing_code',
      'send_message',
      'remove_trusted_peer',
      'update_own_name',
      'check_update',
    ]) {
      await expect(answerCommand(command, {}, context)).resolves.toBeNull();
    }
  });

  it('rejects the commands web mode cannot answer, naming web mode, and an unknown command by name', async () => {
    for (const command of [
      'download_update',
      'install_and_relaunch',
      'prepare_database_backup',
      'finish_database_backup',
      'prune_database_backups',
    ]) {
      await expect(answerCommand(command, {}, context)).rejects.toThrow(
        `${command} is not available in web mode`,
      );
    }
    await expect(answerCommand('no_such_command', {}, context)).rejects.toThrow(
      /^Unknown command: no_such_command$/,
    );
  });
});
