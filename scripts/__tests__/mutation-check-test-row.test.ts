import { describe, it, expect } from 'vitest';
import { testRowFailure, type RunCommand } from '../mutation-check-test-row.ts';

const recording = (status: number | null) => {
  const calls: Parameters<RunCommand>[] = [];
  const run: RunCommand = (...args) => {
    calls.push(args);
    return status;
  };
  return { calls, run };
};

describe('testRowFailure', () => {
  it('runs the test row in the app root', () => {
    const { calls, run } = recording(0);
    testRowFailure('/repository/app', run);
    expect(calls).toEqual([['npx', ['vitest', 'run'], '/repository/app']]);
  });

  it('lets --accept proceed when the test row passes', () => {
    expect(testRowFailure('/repository/app', recording(0).run)).toBeNull();
  });

  it('refuses --accept with the exit status when a test fails', () => {
    expect(testRowFailure('/repository/app', recording(1).run)).toBe(
      'mutation-check: --accept refused — the test row (`npx vitest run` in app/) exited with 1; make every test pass, then re-run with --accept, so no survivor of a failing test is accepted.',
    );
  });

  it('refuses --accept when a signal ended the test row', () => {
    expect(testRowFailure('/repository/app', recording(null).run)).toContain(
      'exited with a signal',
    );
  });
});
