// Checks that the canary cases of app/eslint-rules/__tests__/scoped-rules-canary.test.js catch every listed change to app/eslint.config.js, all in one process (scripts/lint-config-mutations-check.ts), and prints one line per mutation: `caught` with the number of cases that failed, `MISSED` when every case passed, `INVALID` when ESLint rejected the mutated config, so no case ran.
// Usage, from anywhere: `node scripts/lint-config-mutations.ts <mutations.json>…`. Each file is a JSON array of `[label, original, replacement]` string triples; each original must occur exactly once in the config.
// Exits 1 when a mutation is missed or invalid, 2 when a list is malformed, an original does not occur exactly once, or a case fails under the unmutated config.
import { readFileSync } from 'fs';
import path from 'path';
import {
  checkMutations,
  parseMutations,
  type MutationOutcome,
} from './lint-config-mutations-check.ts';

const configPath = path.resolve(import.meta.dirname, '../app/eslint.config.js');
const listFiles = process.argv.slice(2);

if (listFiles.length === 0) {
  console.error(
    'Usage: node scripts/lint-config-mutations.ts <mutations.json>…',
  );
  process.exit(2);
}

const outcomeLine = (outcome: MutationOutcome) => {
  switch (outcome.status) {
    case 'caught':
      return `caught  | ${outcome.label} | ${String(outcome.failedCases.length)} cases failed`;
    case 'missed':
      return `MISSED  | ${outcome.label}`;
    case 'invalid':
      return `INVALID | ${outcome.label} | ${outcome.error}`;
  }
};

const outcomes: MutationOutcome[] = [];
try {
  const mutations = listFiles.flatMap((file) =>
    parseMutations(readFileSync(file, 'utf8')),
  );
  await checkMutations(configPath, mutations, (outcome) => {
    outcomes.push(outcome);
    console.log(outcomeLine(outcome));
  });
} catch (error) {
  console.error(String(error));
  process.exit(2);
}

const uncaught = outcomes.filter((outcome) => outcome.status !== 'caught');
console.log(
  `${String(outcomes.length - uncaught.length)} of ${String(outcomes.length)} mutations caught`,
);
process.exitCode = uncaught.length > 0 ? 1 : 0;
