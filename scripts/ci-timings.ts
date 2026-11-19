// Prints how long each CI check took in the latest successful runs of a workflow on a branch, as the median of the newest `--window` runs against the median of the `--window` runs before them. Reads the runs through the `gh` CLI, which must be signed in. Options: `--branch` (default `main`), `--workflow` (default `ci.yml`), `--window` (default 5).
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import {
  durationsOf,
  percentChange,
  trendsOf,
  type Run,
} from './ci-timings-summary.ts';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

const option = (name: string, fallback: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback);
};

const branch = option('branch', 'main');
const workflow = option('workflow', 'ci.yml');
const window = Number(option('window', '5'));

// The tracked steps are the check rows, which `checks.yml` names by the Check Commands table's keys; its other steps (`Install frontend dependencies`, an action's `Run …`) take several words and are not checks.
const trackedSteps = [
  ...readFileSync(
    path.join(repositoryRoot, '.github/workflows/checks.yml'),
    'utf8',
  ).matchAll(/^\s*- name: (\S+)\s*$/gm),
].map(([, name]) => name);

const gh = (args: string[]) =>
  JSON.parse(
    execFileSync('gh', args, { cwd: repositoryRoot, encoding: 'utf8' }),
  ) as unknown;

const runIds = (
  gh([
    'run',
    'list',
    '--workflow',
    workflow,
    '--branch',
    branch,
    '--status',
    'success',
    '--limit',
    String(window * 2),
    '--json',
    'databaseId',
  ]) as { databaseId: number }[]
).map(({ databaseId }) => databaseId);

if (runIds.length === 0) {
  console.log(`No successful run of ${workflow} on ${branch} yet.`);
  process.exit(0);
}

const runs = runIds.map((id) => {
  const { createdAt, jobs } = gh([
    'run',
    'view',
    String(id),
    '--json',
    'createdAt,jobs',
  ]) as Omit<Run, 'id'>;
  return durationsOf({ id, createdAt, jobs }, trackedSteps);
});

const recentCount = Math.min(window, runs.length);
const previousCount = runs.length - recentCount;
console.log(
  `${workflow} on ${branch}: newest ${recentCount} successful runs (since ${runs[recentCount - 1].createdAt}) against the ${previousCount} before them; seconds, median per window.`,
);

const cell = (seconds: number | null) =>
  seconds === null ? '—' : String(Math.round(seconds));

console.table(
  trendsOf(runs, window).map((trend) => {
    const change = percentChange(trend);
    return {
      check: trend.metric,
      recent: cell(trend.recentMedian),
      previous: cell(trend.previousMedian),
      change: change === null ? '—' : `${Math.round(change)}%`,
    };
  }),
);
