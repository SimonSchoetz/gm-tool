// Node host — the steps `pnpm run dev` takes before the dev app starts: locate the release and dev data directories, decide whether to replace the dev data, and mirror; mirrorFromProcess runs them on a process's streams and returns its exit code. A dev app without a database is mirrored unasked, since it has nothing to lose; otherwise only a `y` or `yes` to the question mirrors, and without a terminal to ask in the dev data is kept. It is loaded under `node`, so its relative imports carry the `.ts` extension Node's type stripping requires.
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { DATABASE_FILE } from '../domain/database/index.ts';
import { mirrorInstalledData } from './devMirror.ts';
import { resolveAppDataDir } from './installedAppData.ts';
import { readAppIdentifiers } from './repositoryJson.ts';

export const MIRROR_QUESTION =
  "Replace the dev data with a copy of the installed app's data? [y/N] ";

export const STARTS_ON_OWN_DATA =
  'The dev app starts on the data it already holds.';

const answerAcceptsMirror = (answer: string): boolean =>
  ['y', 'yes'].includes(answer.trim().toLowerCase());

export const startDevMirror = async ({
  platform,
  homeDir,
  interactive,
  ask,
  log,
}: {
  platform: NodeJS.Platform;
  homeDir: string;
  interactive: boolean;
  ask: (question: string) => Promise<string>;
  log: (line: string) => void;
}): Promise<void> => {
  const identifiers = readAppIdentifiers();
  let sourceDir: string;
  try {
    sourceDir = resolveAppDataDir(platform, homeDir, identifiers.release);
  } catch (error) {
    log(`${String(error)} ${STARTS_ON_OWN_DATA}`);
    return;
  }
  const targetDir = resolveAppDataDir(platform, homeDir, identifiers.dev);
  if (existsSync(join(targetDir, DATABASE_FILE))) {
    if (!interactive) {
      log(
        `No terminal to ask whether to replace the dev data in ${targetDir}, so it is kept. ${STARTS_ON_OWN_DATA}`,
      );
      return;
    }
    if (!answerAcceptsMirror(await ask(MIRROR_QUESTION))) {
      log(`Kept the dev data in ${targetDir}. ${STARTS_ON_OWN_DATA}`);
      return;
    }
  }
  if (mirrorInstalledData({ sourceDir, targetDir }) === 'no-installed-data') {
    log(
      `No installed app data at ${join(sourceDir, DATABASE_FILE)}, so nothing is mirrored. ${STARTS_ON_OWN_DATA}`,
    );
    return;
  }
  log(`Mirrored the installed app's data into ${targetDir}.`);
};

const askIn =
  (input: NodeJS.ReadableStream, output: NodeJS.WritableStream) =>
  async (question: string): Promise<string> => {
    const prompt = createInterface({ input, output });
    try {
      return await prompt.question(question);
    } finally {
      prompt.close();
    }
  };

export const mirrorFromProcess = async ({
  platform,
  stdin,
  stdout,
  stderr,
}: {
  platform: NodeJS.Platform;
  stdin: NodeJS.ReadableStream & { isTTY?: boolean };
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
}): Promise<number> => {
  try {
    await startDevMirror({
      platform,
      homeDir: homedir(),
      interactive: stdin.isTTY === true,
      ask: askIn(stdin, stdout),
      log: (line) => {
        stdout.write(`${line}\n`);
      },
    });
    return 0;
  } catch (error) {
    stderr.write(`${String(error)}\n`);
    return 1;
  }
};
