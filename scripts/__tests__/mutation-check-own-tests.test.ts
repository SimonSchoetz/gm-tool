import { describe, it, expect } from 'vitest';
import { ownTestFiles } from '../mutation-check-own-tests.ts';

describe('ownTestFiles', () => {
  it('names the existing test file beside each source, of either extension, and none for a source without one', () => {
    const existing = new Set([
      'db/util/__tests__/build-query.test.ts',
      'src/hooks/__tests__/useThing.test.tsx',
    ]);

    expect(
      ownTestFiles(
        ['db/util/build-query.ts', 'src/hooks/useThing.ts', 'db/plain.ts'],
        (file) => existing.has(file),
      ),
    ).toEqual([
      'db/util/__tests__/build-query.test.ts',
      'src/hooks/__tests__/useThing.test.tsx',
    ]);
  });
});
