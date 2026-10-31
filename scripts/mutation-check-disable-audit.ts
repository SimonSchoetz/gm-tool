// The logic behind the disable-comment audit of scripts/mutation-check.ts: switching the `// Stryker disable` comments off in a scratch copy of a file, and comparing the mutants of a run with them off against the real run.
// Stryker lists a mutant a disable comment covers in its report with the status `Ignored` and does not run it, so the real run cannot tell a legitimate equivalent mutant from a hidden killable one; a run with the comments off can, because only a mutant the tests kill is hidden by mistake.

export type MutantStatus = "Killed" | "Survived" | "NoCoverage" | "CompileError" | "RuntimeError" | "Timeout" | "Ignored" | "Pending";

type ReportedMutant = {
  mutatorName: string;
  replacement?: string;
  status: MutantStatus;
  statusReason?: string;
  location: { start: { line: number; column: number }; end: { line: number; column: number } };
};

export type MutationReport = {
  files: Record<string, { mutants: ReportedMutant[] }>;
};

export type HiddenKillableMutant = {
  appRelativePath: string;
  line: number;
  column: number;
  mutatorName: string;
  replacement: string;
  reason: string;
};

// Stryker's own pattern for the comment text (`@stryker-mutator/instrumenter` directive-bookkeeper.js), behind the comment opener.
const DISABLE_DIRECTIVE = /(?:\/\/|\/\*)\s?Stryker disable\b/;

// One character swapped in place, so every line and column of the file stays where it was and a mutant is found at the same position in both runs.
export const switchOffDisableDirectives = (source: string): string =>
  source
    .split("\n")
    .map((sourceLine) => sourceLine.replace(DISABLE_DIRECTIVE, (directive) => directive.replace("Stryker disable", "Stryker_disable")))
    .join("\n");

// The `--mutate` entries (`file:start-end`) that cover the ignored mutants of a report, so the audit run mutates nothing else.
export const ignoredMutantEntries = (report: MutationReport): { file: string; entry: string }[] =>
  Object.entries(report.files).flatMap(([file, { mutants }]) =>
    mutants.filter(({ status }) => status === "Ignored").map(({ location }) => ({ file, entry: `${file}:${location.start.line}-${location.end.line}` })),
  );

const mutantKey = (appRelativePath: string, { mutatorName, replacement, location }: ReportedMutant) =>
  `${appRelativePath}:${location.start.line}:${location.start.column}:${mutatorName}:${replacement ?? ""}`;

// A mutant the real run ignored and the run with the comments off killed was hidden by a comment although a test kills it.
export const hiddenKillableMutants = (realReport: MutationReport, auditReport: MutationReport): HiddenKillableMutant[] => {
  const ignoredInRealRun = new Map(
    Object.entries(realReport.files).flatMap(([file, { mutants }]) => mutants.filter(({ status }) => status === "Ignored").map((mutant) => [mutantKey(file, mutant), mutant] as const)),
  );
  return Object.entries(auditReport.files).flatMap(([appRelativePath, { mutants }]) =>
    mutants
      .filter(({ status }) => status === "Killed" || status === "Timeout")
      .flatMap((mutant) => {
        const ignored = ignoredInRealRun.get(mutantKey(appRelativePath, mutant)) ?? null;
        if (ignored === null) return [];
        return [
          {
            appRelativePath,
            line: mutant.location.start.line,
            column: mutant.location.start.column,
            mutatorName: mutant.mutatorName,
            replacement: mutant.replacement ?? "",
            reason: ignored.statusReason ?? "",
          },
        ];
      }),
  );
};
