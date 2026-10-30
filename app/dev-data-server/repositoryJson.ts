// Node host — loaded by Vite's config bundle and by `node` directly. Reads a JSON file of this repository by a path relative to this folder.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const tauriConfigSchema = z.object({ identifier: z.string() });

export const readRepositoryJson = <T>(
  relativePath: string,
  schema: z.ZodType<T>,
): T =>
  schema.parse(
    JSON.parse(
      readFileSync(resolve(import.meta.dirname, relativePath), 'utf8'),
    ),
  );

// The release identifier names the installed app's data directory; the dev identifier names the one the Tauri dev app holds and web mode copies.
export const readAppIdentifiers = (): { release: string; dev: string } => ({
  release: readRepositoryJson('../src-tauri/tauri.conf.json', tauriConfigSchema)
    .identifier,
  dev: readRepositoryJson('../src-tauri/tauri.dev.conf.json', tauriConfigSchema)
    .identifier,
});
