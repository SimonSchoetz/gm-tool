// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readAppIdentifiers, readRepositoryJson } from '../repositoryJson';

const identifierSchema = z.object({ identifier: z.string() });

const readFileJson = <T>(pathFromApp: string, schema: z.ZodType<T>): T =>
  schema.parse(
    JSON.parse(
      readFileSync(resolve(import.meta.dirname, '../..', pathFromApp), 'utf8'),
    ),
  );

describe('readRepositoryJson', () => {
  it('reads the file named relative to the dev data server folder, not to the working directory', () => {
    // Relative to the working directory (`app/`) this path names no file.
    const { identifier } = readRepositoryJson(
      '../src-tauri/tauri.conf.json',
      identifierSchema,
    );

    expect(identifier).toBe(
      readFileJson('src-tauri/tauri.conf.json', identifierSchema).identifier,
    );
  });

  it('returns what the schema makes of the content, not the raw file content', () => {
    const result = readRepositoryJson(
      '../src-tauri/tauri.conf.json',
      identifierSchema.transform(({ identifier }) => ({
        shouted: identifier.toUpperCase(),
      })),
    );

    expect(Object.keys(result)).toEqual(['shouted']);
  });

  it('throws when the content does not match the schema', () => {
    expect(() =>
      readRepositoryJson('../package.json', identifierSchema),
    ).toThrow(z.ZodError);
  });
});

describe('readAppIdentifiers', () => {
  it('names the release identifier from tauri.conf.json and the dev identifier from tauri.dev.conf.json', () => {
    const { release, dev } = readAppIdentifiers();

    expect(release).toBe(
      readFileJson('src-tauri/tauri.conf.json', identifierSchema).identifier,
    );
    expect(dev).toBe(
      readFileJson('src-tauri/tauri.dev.conf.json', identifierSchema)
        .identifier,
    );
    expect(release).not.toBe(dev);
  });
});
