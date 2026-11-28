// Runs the cases of app/eslint-rules/__tests__/scoped-rules-canary.test.js against mutated copies of app/eslint.config.js, all in one process: ESLint, the config's plugins and the TypeScript project service load once and the canary files are written once, so one mutation costs one lint of the canaries by the rules the cases read, not one Vitest run.
import { readFileSync, rmSync, writeFileSync } from 'fs';
import { isDeepStrictEqual } from 'util';
import {
  canaryCases,
  lintCanaries,
  removeCanaries,
  writeCanaries,
} from '../app/eslint-rules/__tests__/support/scopedRulesCanary.js';

/** One config piece to remove or change: the config with `original` replaced by `replacement` must fail at least one canary case. */
type ConfigMutation = {
  label: string;
  original: string;
  replacement: string;
};

/** `caught`: at least one case failed. `missed`: every case passed. `invalid`: ESLint rejected the mutated config, so no case ran. */
export type MutationOutcome =
  | { label: string; status: 'caught'; failedCases: string[] }
  | { label: string; status: 'missed' }
  | { label: string; status: 'invalid'; error: string };

type CanaryLint = Awaited<ReturnType<typeof lintCanaries>>;

/** Parses a mutation list file: a JSON array of `[label, original, replacement]` triples. */
export const parseMutations = (json: string): ConfigMutation[] => {
  const parsed: unknown = JSON.parse(json);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (entry) =>
        Array.isArray(entry) &&
        entry.length === 3 &&
        entry.every((part) => typeof part === 'string'),
    )
  ) {
    throw new Error(
      'A mutation list is a JSON array of [label, original, replacement] string triples',
    );
  }
  return (parsed as [string, string, string][]).map(
    ([label, original, replacement]) => ({ label, original, replacement }),
  );
};

/** The config text with the mutation applied; its original must occur exactly once, or the mutation would change an unintended piece or none. */
// eslint-disable-next-line local/no-unused-exports -- the tests pin that a replacement holding `$&` or `$$` is written literally, which no outcome of checkMutations shows
export const mutatedConfig = (config: string, mutation: ConfigMutation) => {
  const occurrences = config.split(mutation.original).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `${mutation.label}: its original text occurs ${String(occurrences)} times in the config, not once`,
    );
  }
  return config.replace(mutation.original, () => mutation.replacement);
};

const failedCaseNames = async (lint: CanaryLint) => {
  const failed: string[] = [];
  for (const canaryCase of canaryCases) {
    try {
      const comparisons = await canaryCase.compare(lint);
      if (
        comparisons.some(
          ({ actual, expected }) => !isDeepStrictEqual(actual, expected),
        )
      ) {
        failed.push(canaryCase.name);
      }
    } catch {
      // The case throws when ESLint did not lint a canary it reads, which fails its test.
      failed.push(canaryCase.name);
    }
  }
  return failed;
};

/**
 * Checks every mutation of the config at `configPath` against the canary cases. The config file itself is never written: each mutant is written beside it, where its relative imports of the local rules resolve, under a name of its own (Node caches an imported module by its URL), and removed after its lint.
 * Throws before any mutation runs when a mutation's original does not occur exactly once, or when a case fails under the unmutated config.
 */
export const checkMutations = async (
  configPath: string,
  mutations: ConfigMutation[],
  onOutcome: (outcome: MutationOutcome) => void,
) => {
  const config = readFileSync(configPath, 'utf8');
  const mutants = mutations.map((mutation) => ({
    mutation,
    source: mutatedConfig(config, mutation),
  }));
  writeCanaries();
  try {
    const failingUnmutated = await failedCaseNames(
      await lintCanaries(configPath),
    );
    if (failingUnmutated.length > 0) {
      throw new Error(
        `Canary cases fail under the unmutated config: ${failingUnmutated.join('; ')}`,
      );
    }
    for (const [index, { mutation, source }] of mutants.entries()) {
      const mutantPath = configPath.replace(
        /\.js$/,
        `.mutant-${String(process.pid)}-${String(index)}.js`,
      );
      writeFileSync(mutantPath, source);
      try {
        let lint: CanaryLint;
        try {
          lint = await lintCanaries(mutantPath);
        } catch (error) {
          onOutcome({
            label: mutation.label,
            status: 'invalid',
            error: String(error),
          });
          continue;
        }
        const failedCases = await failedCaseNames(lint);
        onOutcome(
          failedCases.length > 0
            ? { label: mutation.label, status: 'caught', failedCases }
            : { label: mutation.label, status: 'missed' },
        );
      } finally {
        rmSync(mutantPath, { force: true });
      }
    }
  } finally {
    removeCanaries();
  }
};
