// Node host — the first half of the `dev` script in package.json, run by `node` before `tauri dev`; its relative imports carry the `.ts` extension Node's type stripping requires. It only wires the release and dev data directories to mirrorInstalledData and turns the outcome into an exit status: a failure sets a non-zero one, which stops the `&&` before the dev app starts on stale data.
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { DATABASE_FILE } from '../domain/database/index.ts';
import { mirrorInstalledData } from './devMirror.ts';
import { resolveInstalledAppDataDir } from './installedAppData.ts';
import { readRepositoryJson, tauriConfigSchema } from './repositoryJson.ts';

const STARTS_ON_OWN_DATA = 'The dev app starts on the data it already holds.';

const run = (): void => {
  const releaseIdentifier = readRepositoryJson(
    '../src-tauri/tauri.conf.json',
    tauriConfigSchema,
  ).identifier;
  const devIdentifier = readRepositoryJson(
    '../src-tauri/tauri.dev.conf.json',
    tauriConfigSchema,
  ).identifier;
  let sourceDir: string;
  try {
    sourceDir = resolveInstalledAppDataDir(
      process.platform,
      homedir(),
      releaseIdentifier,
    );
  } catch (error) {
    console.log(`${String(error)} ${STARTS_ON_OWN_DATA}`);
    return;
  }
  const targetDir = join(dirname(sourceDir), devIdentifier);
  if (mirrorInstalledData({ sourceDir, targetDir }) === 'no-installed-data') {
    console.log(
      `No installed app data at ${join(sourceDir, DATABASE_FILE)}, so nothing is mirrored. ${STARTS_ON_OWN_DATA}`,
    );
    return;
  }
  console.log(`Mirrored the installed app's data into ${targetDir}.`);
};

try {
  run();
} catch (error) {
  console.error(String(error));
  process.exitCode = 1;
}
