// The Stryker command for scripts/mutation-check.ts, run once per mutant (and once for the initial dry run) with the Stryker sandbox as working directory.
// Runs the Vitest tests related to the file that holds the active mutant: Stryker's command runner has no per-mutant test selection, and `__STRYKER_ACTIVE_MUTANT__` names only the mutant's id, so the file is found by the instrumented call `stryMutAct_<hash>("<id>")` Stryker writes into it.
// The initial run has no active mutant and runs the tests related to every file, so a failing baseline fails the run before any mutant is counted as killed.
// A mutant found in none of the files runs no test and so survives, which fails the check rather than hiding the mutant.
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';

const files = (process.env.MUTATION_CHECK_FILES ?? '')
  .split(',')
  .filter(Boolean);
const mutantId = process.env.__STRYKER_ACTIVE_MUTANT__;

const holdsMutant = (file: string) =>
  new RegExp(`stryMutAct_\\w+\\("${mutantId}"\\)`).test(
    readFileSync(file, 'utf8'),
  );
const relatedFiles = mutantId === undefined ? files : files.filter(holdsMutant);

if (mutantId !== undefined && relatedFiles.length === 0) process.exit(0);

const vitest = spawnSync(
  'npx',
  [
    'vitest',
    'related',
    '--run',
    '--passWithNoTests',
    '--bail',
    '1',
    '--maxWorkers',
    '1',
    ...relatedFiles,
  ],
  { stdio: 'inherit' },
);
process.exit(vitest.status ?? 1);
