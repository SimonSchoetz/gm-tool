// @vitest-environment node
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveWebServerConfig } from './webServerConfig';

describe('resolveWebServerConfig', () => {
  it('resolves the project config in web mode, with its aliases', async () => {
    const config = await resolveWebServerConfig();

    expect(config.mode).toBe('web');
    expect(config.resolve.alias).toContainEqual(
      expect.objectContaining({
        find: '@db',
        replacement: resolve(import.meta.dirname, '../../../db'),
      }),
    );
  });
});
