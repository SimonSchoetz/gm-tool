// Mutation-tests only the lines of production files under app/ that the current branch added or changed against main (committed, staged, unstaged and untracked), using app/stryker.config.json.
// Each mutant runs the Vitest tests related to its file through Stryker's command runner (scripts/mutation-check-related.ts): Stryker's Vitest runner 10.0.0 runs no test per mutant under Vitest 5, so it reports every mutant as surviving.
// Only changed files with their own test file (`<dir>/__tests__/<name>.test.ts(x)`) are mutated; the others are listed as skipped.
// With file arguments (`pnpm run mutation-check -- <file>…`, repository-root- or app-relative), only those files are mutated, so a fix loop re-runs the files that had survivors; a run without arguments is the gate.
// Exits non-zero when a mutant survives in one of them: a test that passes with its target logic mutated catches no regression there.
// A survivor that no test could kill (an equivalent mutant) is silenced in the source with a `// Stryker disable next-line <mutator>: <reason>` comment.
// Stryker does not run a mutant a disable comment covers and reports it as `Ignored`, so the gate audits those comments too: for the tested files with an `Ignored` mutant it runs Stryker a second time, on a scratch copy of app/ in which those files' disable comments are switched off (scripts/mutation-check-disable-audit.ts), over the lines of the ignored mutants.
// A mutant that second run kills and the real run ignored was hidden by a comment although a test kills it, and fails the gate with the comment's reason; one that survives with the comments off stays a legitimate equivalent mutant. A branch without an `Ignored` mutant pays nothing for the audit.
import { execFileSync, spawnSync } from "child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { hiddenKillableMutants, ignoredMutantEntries, switchOffDisableDirectives, type MutationReport } from "./mutation-check-disable-audit.ts";

const DEFAULT_BRANCH = "main";
const PRODUCTION_DIRECTORIES = ["src", "services", "domain", "db", "dev-data-server", "platform", "util"];
const REPORT_PATH = "reports/mutation/mutation.json";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const appRoot = path.join(repositoryRoot, "app");

const git = (...args: string[]) => execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" });
const lines = (output: string) => output.split("\n").filter(Boolean);

// A checkout without a local main branch, such as a CI clone, still has the remote-tracking one.
const baseBranch = lines(git("branch", "--list", DEFAULT_BRANCH)).length > 0 ? DEFAULT_BRANCH : `origin/${DEFAULT_BRANCH}`;
const mergeBase = git("merge-base", baseBranch, "HEAD").trim();

const untrackedPaths = new Set(lines(git("ls-files", "--others", "--exclude-standard")));
const changedPaths = new Set([...lines(git("diff", "--name-only", "--diff-filter=d", mergeBase)), ...untrackedPaths]);

// The lines the branch added or changed in a file, as Stryker `--mutate` entries (`file:start-end`), so a survivor in logic the branch did not write never fails it; an untracked file is new as a whole.
const mutateEntries = (appRelativePath: string) => {
  if (untrackedPaths.has(`app/${appRelativePath}`)) return [appRelativePath];
  return lines(git("diff", "--unified=0", mergeBase, "--", `app/${appRelativePath}`))
    .map((line) => /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line))
    .filter((hunk) => hunk !== null)
    .map(([, start, count = "1"]) => [Number(start), Number(count)])
    .filter(([, count]) => count > 0)
    .map(([start, count]) => `${appRelativePath}:${start}-${start + count - 1}`);
};

const isProductionSource = (appRelativePath: string) =>
  PRODUCTION_DIRECTORIES.some((directory) => appRelativePath.startsWith(`${directory}/`)) &&
  /\.tsx?$/.test(appRelativePath) &&
  !appRelativePath.endsWith(".d.ts") &&
  !appRelativePath.includes("__tests__/") &&
  appRelativePath !== "src/routeTree.gen.ts";

const filesToMutate = [...changedPaths]
  .filter((repositoryPath) => repositoryPath.startsWith("app/"))
  .map((repositoryPath) => repositoryPath.slice("app/".length))
  .filter(isProductionSource)
  .sort();

if (filesToMutate.length === 0) {
  console.log(`mutation-check: no production source under app/ changed against ${baseBranch}; nothing to mutate.`);
  process.exit(0);
}

const hasOwnTestFile = (appRelativePath: string) => {
  const { dir, name } = path.parse(appRelativePath);
  return [".test.ts", ".test.tsx"].some((suffix) => existsSync(path.join(appRoot, dir, "__tests__", `${name}${suffix}`)));
};

// pnpm may forward the `--` separator as an argument.
const requestedFiles = process.argv.slice(2).filter((argument) => argument !== "--").map((argument) => argument.replace(/^(\.\/)?app\//, ""));
const unknownRequestedFiles = requestedFiles.filter((file) => !filesToMutate.includes(file));
if (unknownRequestedFiles.length > 0) {
  console.error(`mutation-check: not a changed production source under app/ against ${baseBranch}:\n  ${unknownRequestedFiles.join("\n  ")}`);
  process.exit(2);
}
const selectedFiles = requestedFiles.length > 0 ? filesToMutate.filter((file) => requestedFiles.includes(file)) : filesToMutate;

const testedFiles = selectedFiles.filter(hasOwnTestFile);
const untestedFiles = selectedFiles.filter((file) => !hasOwnTestFile(file));

if (untestedFiles.length > 0) {
  console.log(`mutation-check: skipping ${untestedFiles.length} changed file(s) without their own test file:\n  ${untestedFiles.join("\n  ")}`);
}

// One Stryker run for all files: its sandbox, processes and initial test run are paid once, and the command in app/stryker.config.json (scripts/mutation-check-related.ts) runs for each mutant only the tests related to the mutant's own file.
const entries = testedFiles.flatMap((file) => {
  const fileEntries = mutateEntries(file);
  console.log(`\nmutation-check: ${fileEntries.join(", ") || `${file} (lines removed only)`}`);
  return fileEntries.map((entry) => ({ file, entry }));
});
const filesWithEntries = [...new Set(entries.map(({ file }) => file))];

// One Stryker run with `workingDirectory` as app/, over the given `--mutate` entries; exits the script when Stryker itself fails.
const runStryker = (workingDirectory: string, runEntries: string[], runFiles: string[]) => {
  rmSync(path.join(workingDirectory, REPORT_PATH), { force: true });
  const stryker = spawnSync("npx", ["stryker", "run", "--mutate", runEntries.join(",")], {
    cwd: workingDirectory,
    stdio: "inherit",
    env: {
      ...process.env,
      MUTATION_CHECK_FILES: runFiles.join(","),
      MUTATION_CHECK_RUNNER: path.join(repositoryRoot, "scripts", "mutation-check-related.ts"),
    },
  });
  if (stryker.status !== 0) {
    console.error(`mutation-check: Stryker exited with ${stryker.status ?? stryker.signal}.`);
    process.exit(stryker.status ?? 1);
  }
  return JSON.parse(readFileSync(path.join(workingDirectory, REPORT_PATH), "utf8")) as MutationReport;
};

// app/ without what Stryker's own sandbox would copy again; `node_modules` is linked, as Stryker links it into its sandbox. Each audited file has its disable comments switched off. The copy is removed when the script exits, whichever way it does.
const auditCopyOfApp = (auditedFiles: string[]) => {
  const scratchRoot = mkdtempSync(path.join(os.tmpdir(), "mutation-check-audit-"));
  process.on("exit", () => rmSync(scratchRoot, { recursive: true, force: true }));
  const scratchApp = path.join(scratchRoot, "app");
  const excluded = ["node_modules", "reports", ".stryker-tmp", path.join("src-tauri", "target")].map((entry) => path.join(appRoot, entry));
  cpSync(appRoot, scratchApp, { recursive: true, filter: (source) => !excluded.includes(source) });
  symlinkSync(path.join(appRoot, "node_modules"), path.join(scratchApp, "node_modules"), "dir");
  for (const file of auditedFiles) {
    const scratchFile = path.join(scratchApp, file);
    writeFileSync(scratchFile, switchOffDisableDirectives(readFileSync(scratchFile, "utf8")));
  }
  return scratchApp;
};

const survivors: string[] = [];
const hiddenMutants: string[] = [];

if (entries.length > 0) {
  const report = runStryker(
    appRoot,
    entries.map(({ entry }) => entry),
    filesWithEntries,
  );
  for (const [appRelativePath, { mutants }] of Object.entries(report.files)) {
    for (const mutant of mutants) {
      if (mutant.status !== "Survived") continue;
      const { line, column } = mutant.location.start;
      survivors.push(`app/${appRelativePath}:${line}:${column}  ${mutant.mutatorName}  → ${(mutant.replacement ?? "").replace(/\s+/g, " ")}`);
    }
  }

  const ignoredEntries = ignoredMutantEntries(report);
  if (ignoredEntries.length > 0) {
    const auditedFiles = [...new Set(ignoredEntries.map(({ file }) => file))];
    const auditEntries = [...new Set(ignoredEntries.map(({ entry }) => entry))];
    console.log(`\nmutation-check: auditing the Stryker disable comments at ${auditEntries.join(", ")} with the comments switched off`);
    const auditReport = runStryker(auditCopyOfApp(auditedFiles), auditEntries, auditedFiles);
    for (const hidden of hiddenKillableMutants(report, auditReport)) {
      hiddenMutants.push(
        `app/${hidden.appRelativePath}:${hidden.line}:${hidden.column}  ${hidden.mutatorName}  → ${hidden.replacement.replace(/\s+/g, " ")}  hidden by a disable comment with the reason "${hidden.reason}"`,
      );
    }
  }
}

if (survivors.length > 0) {
  console.error(`\nmutation-check: FAILED — ${survivors.length} mutant(s) survived in files with their own tests; the tests pass with this logic changed:\n  ${survivors.join("\n  ")}`);
}
if (hiddenMutants.length > 0) {
  console.error(`\nmutation-check: FAILED — ${hiddenMutants.length} mutant(s) are hidden by a Stryker disable comment although a test kills them; rewrite the line so the comment is not needed, or drop the comment:\n  ${hiddenMutants.join("\n  ")}`);
}
if (survivors.length > 0 || hiddenMutants.length > 0) process.exit(1);
console.log(`\nmutation-check: passed — no mutant survived in the ${testedFiles.length} changed file(s) with their own tests, and no disable comment hides a mutant a test kills.`);
