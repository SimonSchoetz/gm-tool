import { readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkMutations,
  mutatedConfig,
  parseMutations,
  type MutationOutcome,
} from '../lint-config-mutations-check.ts';

const appDir = path.resolve(import.meta.dirname, '../../app');
const projectConfigPath = path.join(appDir, 'eslint.config.js');
const projectConfig = readFileSync(projectConfigPath, 'utf8');

type ConfigMutation = Parameters<typeof mutatedConfig>[1];

const mutation = (
  original: string,
  replacement: string,
  label = original,
): ConfigMutation => ({ label, original, replacement });

describe('parseMutations', () => {
  it('reads each [label, original, replacement] triple in list order', () => {
    expect(parseMutations('[["a", "b", "c"], ["d", "e", ""]]')).toEqual([
      mutation('b', 'c', 'a'),
      mutation('e', '', 'd'),
    ]);
  });

  it.each([
    ['an object', '{"a": ["b", "c", "d"]}'],
    ['a pair', '[["a", "b"]]'],
    ['a number in a triple', '[["a", "b", 1]]'],
  ])('rejects %s, which names no mutation', (_shape, json) => {
    expect(() => parseMutations(json)).toThrow(
      /^A mutation list is a JSON array of \[label, original, replacement\] string triples$/,
    );
  });
});

describe('mutatedConfig', () => {
  it('replaces the one occurrence of the original, taking the replacement literally', () => {
    expect(mutatedConfig('a b c', mutation('b', '$&$&'))).toBe('a $&$& c');
  });

  it.each([
    ['no', 'a c', 0],
    ['two', 'b b', 2],
  ])(
    'rejects an original found %s times, which would mutate no piece or an unintended one',
    (_count, config, occurrences) => {
      expect(() => mutatedConfig(config, mutation('b', 'x', 'label'))).toThrow(
        new RegExp(
          `^label: its original text occurs ${String(occurrences)} times in the config, not once$`,
        ),
      );
    },
  );
});

// The mutants sit beside the config and each canary directory directly under a layer root (`src/` or one of its directories), so two levels below app/ hold them all.
const strayFiles = () => {
  const ownNames = (directory: string) =>
    readdirSync(directory, { withFileTypes: true }).filter(
      (entry) =>
        entry.name.includes(`mutant-${String(process.pid)}-`) ||
        entry.name === `__scoped-rules-canary-${String(process.pid)}__`,
    );
  const layerRoots = readdirSync(appDir, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && entry.name !== 'node_modules',
  );
  return [
    appDir,
    ...layerRoots.map((entry) => path.join(appDir, entry.name)),
    ...layerRoots.flatMap((entry) =>
      readdirSync(path.join(appDir, entry.name), { withFileTypes: true })
        .filter((child) => child.isDirectory())
        .map((child) => path.join(appDir, entry.name, child.name)),
    ),
  ].flatMap((directory) =>
    ownNames(directory).map((entry) => path.join(directory, entry.name)),
  );
};

describe('checkMutations against the project eslint.config.js', () => {
  const brokenConfigPath = path.join(
    appDir,
    `eslint.config.unmutated-${String(process.pid)}.js`,
  );

  afterEach(() => {
    rmSync(brokenConfigPath, { force: true });
  });

  it('reports a mutation a case fails on as caught, one every case passes as missed and a config ESLint rejects as invalid, leaving the config and no mutant or canary behind', async () => {
    const outcomes: MutationOutcome[] = [];
    await checkMutations(
      projectConfigPath,
      [
        mutation(
          "      'no-restricted-syntax': syntaxRules(),\n",
          '',
          'caught',
        ),
        mutation(
          'Use "as const" objects instead of enums.',
          'A message no case reads.',
          'missed',
        ),
        mutation(
          "rules: { 'no-restricted-syntax': syntaxRules(looseToThrowMatcher) },",
          "rulez: { 'no-restricted-syntax': syntaxRules(looseToThrowMatcher) },",
          'invalid',
        ),
      ],
      (outcome) => outcomes.push(outcome),
    );

    expect(outcomes).toEqual([
      {
        label: 'caught',
        status: 'caught',
        failedCases: [
          'keeps the enum ban in a file no later syntax block matches',
        ],
      },
      { label: 'missed', status: 'missed' },
      {
        label: 'invalid',
        status: 'invalid',
        error: expect.stringMatching(/rulez/) as unknown as string,
      },
    ]);
    expect(readFileSync(projectConfigPath, 'utf8')).toBe(projectConfig);
    expect(strayFiles()).toEqual([]);
  }, 120_000);

  it('runs no mutation when a case already fails under the unmutated config, since every mutation would count as caught', async () => {
    writeFileSync(
      brokenConfigPath,
      mutatedConfig(
        projectConfig,
        mutation("      'no-restricted-syntax': syntaxRules(),\n", ''),
      ),
    );
    const outcomes: MutationOutcome[] = [];

    await expect(
      checkMutations(
        brokenConfigPath,
        [mutation('Use "as const" objects instead of enums.', 'x')],
        (outcome) => outcomes.push(outcome),
      ),
    ).rejects.toThrow(
      /^Canary cases fail under the unmutated config: keeps the enum ban in a file no later syntax block matches$/,
    );
    expect(outcomes).toEqual([]);
    expect(strayFiles()).toEqual([]);
  }, 120_000);

  it('runs no mutation when an original of the list does not occur in the config, since its outcome would describe no piece', async () => {
    const outcomes: MutationOutcome[] = [];

    await expect(
      checkMutations(
        projectConfigPath,
        [
          mutation("      'no-restricted-syntax': syntaxRules(),\n", ''),
          mutation('a text no config holds', '', 'absent'),
        ],
        (outcome) => outcomes.push(outcome),
      ),
    ).rejects.toThrow(
      /^absent: its original text occurs 0 times in the config, not once$/,
    );
    expect(outcomes).toEqual([]);
  });
});
