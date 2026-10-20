// @vitest-environment node
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFixtureCycle } from '../fixtureCycle';

const FIXTURES_DIR = resolve(import.meta.dirname, '../fixtures/images');
const fixturePaths = readdirSync(FIXTURES_DIR)
  .sort()
  .map((name) => join(FIXTURES_DIR, name));
const [landscapePng, portraitJpg, squareWebp] = fixturePaths;

describe('createFixtureCycle', () => {
  it('returns the fixtures in file-name order, wrapping around', () => {
    const next = createFixtureCycle([squareWebp, landscapePng, portraitJpg]);
    const all = ['png', 'jpg', 'webp'];

    expect([next(all), next(all), next(all), next(all)]).toEqual([
      landscapePng,
      portraitJpg,
      squareWebp,
      landscapePng,
    ]);
  });

  it('skips fixtures whose extension was not asked for and wraps to the same one', () => {
    const next = createFixtureCycle(fixturePaths);

    expect(next(['jpg', 'jpeg'])).toBe(portraitJpg);
    expect(next(['jpg', 'jpeg'])).toBe(portraitJpg);
  });

  it('returns null without advancing when no fixture matches', () => {
    const next = createFixtureCycle(fixturePaths);
    expect(next(['png'])).toBe(landscapePng);

    expect(next(['gif'])).toBeNull();

    expect(next(['png', 'jpg', 'webp'])).toBe(portraitJpg);
  });
});
