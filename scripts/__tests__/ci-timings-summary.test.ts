import { describe, expect, it } from 'vitest';
import { durationsOf, trendsOf, type Run } from '../ci-timings-summary.ts';

type RunDurations = ReturnType<typeof durationsOf>;

const at = (second: number) =>
  new Date(Date.UTC(2026, 0, 1, 0, 0, second)).toISOString();

const step = (
  name: string,
  from: number,
  to: number,
  conclusion: string | null = 'success',
) => ({ name, conclusion, startedAt: at(from), completedAt: at(to) });

const run = (jobs: Run['jobs']): Run => ({ id: 1, createdAt: at(0), jobs });

const durations = (id: number, entries: [string, number][]): RunDurations => ({
  id,
  createdAt: at(0),
  seconds: new Map(entries),
});

describe('durationsOf', () => {
  it('measures each tracked step and each job of a run, and nothing untracked', () => {
    const result = durationsOf(
      run([
        {
          ...step('checks / test', 0, 50),
          steps: [
            step('Install frontend dependencies', 0, 10),
            step('test', 10, 45),
          ],
        },
      ]),
      ['test'],
    );

    expect([...result.seconds]).toEqual([
      ['job checks / test', 50],
      ['test', 35],
    ]);
  });

  it('leaves out a step or job that did not succeed or never finished, whose time would understate the check', () => {
    const result = durationsOf(
      run([
        {
          ...step('checks / rust', 0, 30, 'failure'),
          steps: [
            step('rust-lint', 0, 20, 'failure'),
            step('rust-test', 20, 20, 'skipped'),
            {
              name: 'rust-format-check',
              conclusion: 'success',
              startedAt: at(0),
              completedAt: null,
            },
          ],
        },
      ]),
      ['rust-lint', 'rust-test', 'rust-format-check'],
    );

    expect(result.seconds.size).toBe(0);
  });
});

describe('trendsOf', () => {
  it('compares the median of the newest runs with the median of the runs before them, newest first', () => {
    const runs = [
      durations(6, [['test', 120]]),
      durations(5, [['test', 100]]),
      durations(4, [['test', 110]]),
      durations(3, [['test', 60]]),
      durations(2, [['test', 90]]),
      durations(1, [['test', 70]]),
      durations(0, [['test', 999]]),
    ];

    expect(trendsOf(runs, 3)).toEqual([
      { metric: 'test', recentMedian: 110, previousMedian: 70 },
    ]);
  });

  it('leaves a run that lacks a metric out of that metric median, and reports no previous median without older runs', () => {
    const runs = [
      durations(2, [
        ['test', 100],
        ['rust-test', 80],
      ]),
      durations(1, [['test', 50]]),
    ];

    expect(trendsOf(runs, 2)).toEqual([
      { metric: 'test', recentMedian: 75, previousMedian: null },
      { metric: 'rust-test', recentMedian: 80, previousMedian: null },
    ]);
  });
});
