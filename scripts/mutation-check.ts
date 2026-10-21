// Mutation-tests only the lines of production files under app/ that the current branch added or changed against main (committed, staged, unstaged and untracked), using app/stryker.config.json.
// Each mutant runs the Vitest tests related to its file through Stryker's command runner: Stryker's Vitest runner 10.0.0 runs no test per mutant under Vitest 5, so it reports every mutant as surviving.
// Only changed files with their own test file (`<dir>/__tests__/<name>.test.ts(x)`) are mutated; the others are listed as skipped.
// Exits non-zero when a mutant survives in one of them: a test that passes with its target logic mutated catches no regression there.
// A survivor that no test could kill (an equivalent mutant) is silenced in the source with a `// Stryker disable next-line <mutator>: <reason>` comment.
import { execFileSync, spawnSync } from "child_process";
import { existsSync, readFileSync, rmSync } from "fs";
import path from "path";

type MutantStatus = "Killed" | "Survived" | "NoCoverage" | "CompileError" | "RuntimeError" | "Timeout" | "Ignored" | "Pending";

type MutationReport = {
  files: Record<
    string,
    {
      mutants: {
        mutatorName: string;
        replacement?: string;
        status: MutantStatus;
        location: { start: { line: number; column: number } };
      }[];
    }
  >;
};

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

const testedFiles = filesToMutate.filter(hasOwnTestFile);
const untestedFiles = filesToMutate.filter((file) => !hasOwnTestFile(file));

if (untestedFiles.length > 0) {
  console.log(`mutation-check: skipping ${untestedFiles.length} changed file(s) without their own test file:\n  ${untestedFiles.join("\n  ")}`);
}

const survivors: string[] = [];

// One Stryker run per file, so each mutant runs only the tests related to its own file rather than to every changed file.
for (const [index, file] of testedFiles.entries()) {
  const entries = mutateEntries(file);
  console.log(`\nmutation-check: [${index + 1}/${testedFiles.length}] ${entries.join(", ") || `${file} (lines removed only)`}`);
  if (entries.length === 0) continue;
  rmSync(path.join(appRoot, REPORT_PATH), { force: true });
  // The command in app/stryker.config.json runs `vitest related` on MUTATION_CHECK_FILES for each mutant.
  const stryker = spawnSync("npx", ["stryker", "run", "--mutate", entries.join(",")], {
    cwd: appRoot,
    stdio: "inherit",
    env: { ...process.env, MUTATION_CHECK_FILES: file },
  });
  if (stryker.status !== 0) {
    console.error(`mutation-check: Stryker exited with ${stryker.status ?? stryker.signal} on ${file}.`);
    process.exit(stryker.status ?? 1);
  }

  const report = JSON.parse(readFileSync(path.join(appRoot, REPORT_PATH), "utf8")) as MutationReport;
  for (const [appRelativePath, { mutants }] of Object.entries(report.files)) {
    for (const mutant of mutants) {
      if (mutant.status !== "Survived") continue;
      const { line, column } = mutant.location.start;
      survivors.push(`app/${appRelativePath}:${line}:${column}  ${mutant.mutatorName}  → ${(mutant.replacement ?? "").replace(/\s+/g, " ")}`);
    }
  }
}

if (survivors.length > 0) {
  console.error(`\nmutation-check: FAILED — ${survivors.length} mutant(s) survived in files with their own tests; the tests pass with this logic changed:\n  ${survivors.join("\n  ")}`);
  process.exit(1);
}
console.log(`\nmutation-check: passed — no mutant survived in the ${testedFiles.length} changed file(s) with their own tests.`);
