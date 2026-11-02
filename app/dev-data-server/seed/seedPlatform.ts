// Node host — evaluated by the seed's own Vite server, which aliases `@platform` to this file (seedDatabase.ts), so the db code the seed's service calls reach loads the database the server provides and answers `invoke` from the dev data server's own command table, instead of asking Tauri or the dev data server over HTTP. It exports only `loadDatabase` and `invoke`: the seed calls no service that reaches another platform member, and Vite's module runner reads an imported member only where code uses it.
import type Database from '@tauri-apps/plugin-sql';
import { answerCommand, type CommandContext } from '../commands';

let providedContext: CommandContext | null = null;

export const provideSeedContext = (context: CommandContext): void => {
  providedContext = context;
};

const seedContext = (): CommandContext => {
  if (providedContext === null) {
    throw new Error(
      'The web-mode seed loaded the database before one was provided.',
    );
  }
  return providedContext;
};

// Takes no argument, though db/database.ts passes the file name: the provided database is the one the seed fills, whatever file is asked for.
export const loadDatabase = (): Promise<Database> =>
  new Promise((resolve) => {
    resolve(seedContext().db);
  });

export const invoke = async <T>(
  command: string,
  args: Record<string, unknown> = {},
): Promise<T> => (await answerCommand(command, args, seedContext())) as T;
