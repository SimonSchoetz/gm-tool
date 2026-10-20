// Node host — imported by vitePlugin.ts and by runDevMirror.ts, which `node` runs directly. Reads a JSON file of this repository by a path relative to this folder.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

export const tauriConfigSchema = z.object({ identifier: z.string() });

export const readRepositoryJson = <T>(
  relativePath: string,
  schema: z.ZodType<T>,
): T =>
  schema.parse(
    JSON.parse(
      readFileSync(resolve(import.meta.dirname, relativePath), 'utf8'),
    ),
  );
