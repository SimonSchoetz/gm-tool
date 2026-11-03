// The guard scripts/mutation-check.ts runs before `--accept` may write ledger entries: the `test` row of root CLAUDE.md's Check Commands (`npx vitest run` in app/) must pass.
// A survivor is equivalent only if a passing suite cannot observe it; while a test fails — say a new test meant to kill the mutant — accepting its survivors would record an untested mutant as one no test can observe.
import { spawnSync } from 'child_process';

// Runs a command in `cwd` with its output shown, and returns its exit status (null when a signal ended it).
export type RunCommand = (
  command: string,
  args: string[],
  cwd: string,
) => number | null;

const runShown: RunCommand = (command, args, cwd) =>
  spawnSync(command, args, { cwd, stdio: 'inherit' }).status;

// The message to refuse `--accept` with, or null when the test row passes.
export const testRowFailure = (appRoot: string, run = runShown) => {
  const status = run('npx', ['vitest', 'run'], appRoot);
  return status === 0
    ? null
    : `mutation-check: --accept refused — the test row (\`npx vitest run\` in app/) exited with ${status ?? 'a signal'}; make every test pass, then re-run with --accept, so no survivor of a failing test is accepted.`;
};
