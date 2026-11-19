// Turns the jobs of finished GitHub Actions runs into per-check durations and compares the median of the most recent runs with the median of the runs before them. A single run says little, since one runner can take twice as long as another on the same code; the medians of two windows show a trend.

type Step = {
  name: string;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

type Job = {
  name: string;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  steps: Step[];
};

export type Run = {
  id: number;
  createdAt: string;
  jobs: Job[];
};

type RunDurations = {
  id: number;
  createdAt: string;
  seconds: Map<string, number>;
};

type MetricTrend = {
  metric: string;
  recentMedian: number | null;
  previousMedian: number | null;
};

const secondsBetween = (start: string, end: string) =>
  (Date.parse(end) - Date.parse(start)) / 1000;

const succeededWithin = (part: Step | Job) =>
  part.conclusion === 'success' && part.startedAt && part.completedAt
    ? secondsBetween(part.startedAt, part.completedAt)
    : null;

// A job is measured as `job <name>` beside its tracked steps, so a slower job whose steps all held steady (a slower setup or cache restore) still shows.
export const durationsOf = (
  run: Run,
  trackedSteps: readonly string[],
): RunDurations => {
  const seconds = new Map<string, number>();
  for (const job of run.jobs) {
    const jobSeconds = succeededWithin(job);
    if (jobSeconds !== null) seconds.set(`job ${job.name}`, jobSeconds);
    for (const step of job.steps) {
      const stepSeconds = trackedSteps.includes(step.name)
        ? succeededWithin(step)
        : null;
      if (stepSeconds !== null) seconds.set(step.name, stepSeconds);
    }
  }
  return { id: run.id, createdAt: run.createdAt, seconds };
};

const median = (values: readonly number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

// `runs` is newest first, as `gh run list` returns them. The recent window is the newest `window` runs, the previous window the `window` runs before them; a metric a run lacks (a job that failed or was skipped) leaves that run out of its median.
export const trendsOf = (
  runs: readonly RunDurations[],
  window: number,
): MetricTrend[] => {
  const recent = runs.slice(0, window);
  const previous = runs.slice(window, window * 2);
  const metrics = [...new Set(runs.flatMap((run) => [...run.seconds.keys()]))];
  const medianOf = (windowRuns: readonly RunDurations[], metric: string) =>
    median(
      windowRuns.flatMap((run) => {
        const value = run.seconds.get(metric) ?? null;
        return value === null ? [] : [value];
      }),
    );
  return metrics.map((metric) => ({
    metric,
    recentMedian: medianOf(recent, metric),
    previousMedian: medianOf(previous, metric),
  }));
};
