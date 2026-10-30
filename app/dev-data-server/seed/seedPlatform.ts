// Node host — evaluated by the seed's own Vite server, which aliases `@platform` to this file (seedDatabase.ts), so the db code the seed's service calls reach loads the database the server provides instead of asking Tauri or the dev data server. It exports only `loadDatabase`: the seed calls no service that reaches another platform member, and Vite's module runner reads an imported member only where code uses it, so services/imageService.ts importing `invoke` loads without one.
import type Database from '@tauri-apps/plugin-sql';

let providedDatabase: Database | null = null;

export const provideSeedDatabase = (db: Database): void => {
  providedDatabase = db;
};

// Takes no argument, though db/database.ts passes the file name: the provided database is the one the seed fills, whatever file is asked for.
export const loadDatabase = (): Promise<Database> =>
  providedDatabase === null
    ? Promise.reject(
        new Error(
          'The web-mode seed loaded the database before one was provided.',
        ),
      )
    : Promise.resolve(providedDatabase);
