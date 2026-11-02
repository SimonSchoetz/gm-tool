# Stryker

## `@stryker-mutator/vitest-runner` 10.0.0 declares a `vitest >=2.0.0` peer range but, under Vitest 5.0.2, runs no test for any mutant, so it reports every mutant as `Survived`

**Verified at:** `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` 10.0.0, Vitest 5.0.2 — 2026-10-21
**Citation:** [mutation-check_1: ran `npm view @stryker-mutator/vitest-runner@10.0.0 peerDependencies devDependencies` — observed peer `vitest: ">=2.0.0"` and dev dependency `vitest: "4.1.10"`] [mutation-check_2: ran `npx stryker run --mutate src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/helper/readSaveableHp.ts` with `testRunner: "vitest"` in `app/` — observed the initial test run pass 4 tests and every one of the 11 mutants reported `Survived` with `testsCompleted: 0` in `reports/mutation/mutation.json`, including mutants the existing tests fail on] [mutation-check_6: `@stryker-mutator/vitest-runner@10.0.0/dist/src/vitest-test-runner.js` — `run` sets `project.config.testNamePattern` from the mutant's test ids before `ctx.start(testFiles)`] [mutation-check_7: ran a `createVitest('test', { config: 'vitest.config.ts' })` script in `app/` that set `testNamePattern` to one test's full name on every project before `start([<its test file>])` — observed 0 tests with a result, against 4 without the pattern]

Its mutant runs filter tests by setting `testNamePattern` on each Vitest project's config and start no matching test under Vitest 5. Until a release of the runner states Vitest 5 support and passes a run whose mutants the tests fail on, mutation testing under Vitest 5 goes through Stryker's `command` test runner instead.

## Under pnpm's isolated `node_modules`, `@stryker-mutator/core` 10.0.0 loads `@stryker-mutator/vitest-runner` only when the `plugins` option names it

**Verified at:** `@stryker-mutator/core` 10.0.0, pnpm 12.4.2 — 2026-10-21
**Citation:** [mutation-check_3: ran `npx stryker run` in `app/` with `testRunner: "vitest"` and no `plugins` option — observed `Cannot find TestRunner plugin "vitest". In fact, no TestRunner plugins were loaded`; the same run with `"plugins": ["@stryker-mutator/vitest-runner"]` loaded it]

The runner was installed in `app/` with `pnpm add -D` for this check and removed afterwards.

## Stryker's `command` test runner runs `commandRunner.command` once per mutant and counts exit code 0 as the mutant surviving, with no coverage analysis

**Verified at:** `@stryker-mutator/core` 10.0.0, <https://stryker-mutator.io/docs/stryker-js/configuration/> — 2026-10-21
**Citation:** [mutation-check_4: `https://stryker-mutator.io/docs/stryker-js/configuration/` — the command runner "bases the result on the exit code of that program (0 for success, otherwise failed)" and supports no coverage analysis, and Stryker "just runs all tests for all mutants"] [mutation-check_5: ran `pnpm run mutation-check` with `testRunner: "command"` and the command `npx vitest related --run --passWithNoTests --bail 1 --maxWorkers 1 $MUTATION_CHECK_FILES`, with `MUTATION_CHECK_FILES` set by `scripts/mutation-check.ts` to the one changed file — observed 4 of 11 mutants `Survived` against a test asserting only `toBeDefined()`, and all 11 `Killed` once that test asserted the result]

That run shows the command's shell expanding an environment variable set on the Stryker process, and the activated mutant reaching the Vitest workers the command starts.

## A `// Stryker disable next-line <mutator>: <reason>` comment on the line above gives that line's mutants of that mutator the `Ignored` status, which leaves them out of the mutation score

**Verified at:** `@stryker-mutator/core` 10.0.0, <https://stryker-mutator.io/docs/stryker-js/disable-mutants/> — 2026-10-21
**Citation:** [mutation-check_8: `https://stryker-mutator.io/docs/stryker-js/disable-mutants/` — form `// Stryker [disable|restore] [next-line] *mutatorList*[: custom reason]`, and disabled mutants "will get the `ignored` status"]

The reason after the colon is optional.

## A Stryker `--mutate` entry `<file>:<start>-<end>` mutates only that file's lines in the range, and several such entries for one file can be passed comma-separated

**Verified at:** `@stryker-mutator/core` 10.0.0, <https://stryker-mutator.io/docs/stryker-js/configuration/> — 2026-10-21
**Citation:** [mutation-check_9: `https://stryker-mutator.io/docs/stryker-js/configuration/` — "`src/app.js:1-11`" mutates lines 1 through 11, and a range cannot be combined with a glob in one entry] [mutation-check_10: ran `npx stryker run --mutate db/image/create.ts:1-2,db/image/create.ts:16-16` through `scripts/mutation-check.ts` in `app/` — observed `Instrumented 1 source file(s) with 5 mutant(s)`, against 24 for the whole file]

## A `--mutate` range creates a mutant only when the mutant's whole location lies inside the range, so a multi-line mutant needs a range that covers its last line

**Verified at:** `@stryker-mutator/core` and `@stryker-mutator/instrumenter` 10.0.0 — 2026-11-02
**Citation:** [architect_3: `app/node_modules/.pnpm/@stryker-mutator+instrumenter@10.0.0/node_modules/@stryker-mutator/instrumenter/dist/src/transformers/babel-transformer.js:145-149` — `shouldMutate` requires `locationIncluded(range, path.node.loc)`, and `app/node_modules/.pnpm/@stryker-mutator+instrumenter@10.0.0/node_modules/@stryker-mutator/instrumenter/dist/src/util/syntax-helpers.js:173-181` — `locationIncluded` needs the range to start no later and end no earlier than the node] [architect_4: `app/node_modules/.pnpm/@stryker-mutator+core@10.0.0_@types+node@26.6.3/node_modules/@stryker-mutator/core/dist/src/fs/project-reader.js:196-206` — `file:a-b` becomes line `a-1` column 0 to line `b-1` column `Number.MAX_SAFE_INTEGER`] [architect_5: ran a scratch script that instruments `app/platform/webPlatform.ts` as of `9da20afa` (its `catch` block on lines 42 to 44) through the installed `Instrumenter.instrument` with whole-line ranges for file line 42 alone and for lines 42 to 44 — observed no mutant for 42, and the `catch` block's `BlockStatement "{}"` for 42 to 44]

A change to only the first line of a multi-line construct therefore produces no mutant for the construct.

## A `// Stryker disable next-line Regex` comment above `statement.replace(/\$(\d+)/g, '?$1')` ignores both of that line's Regex mutants, the killable `/\$(\D+)/g` one with the equivalent `/\$(\d)/g`; rewritten as `replace(/\$(?=\d)/g, '?')`, the line yields only Regex mutants the tests kill

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-21
**Citation:** [mutant-triage_1: ran `npx stryker run --mutate dev-data-server/sqliteDatabase.ts` in `app/` with the comment above the line — observed both Regex mutants `Ignored`, where without it `/\$(\D+)/g` was `Killed` and `/\$(\d)/g` `Survived`] [mutant-triage_4: ran the same command on the lookahead form with no comment — observed Regex mutants `/\$(?!\d)/g` and `/\$(?=\D)/g`, both `Killed`]

A next-line comment names a mutator, not a replacement, so on that line it could not keep the killable mutant active while ignoring the equivalent one; the behaviour-identical rewrite removed the equivalent mutant instead.

## A `// Stryker disable next-line BlockStatement` comment written as the last line of a `try` block, directly above `} catch {`, leaves the catch block's BlockStatement mutant active

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-21
**Citation:** [mutant-triage_2: ran `npx stryker run --mutate platform/webPlatform.ts` in `app/` with the comment directly above `} catch {` — observed the catch block's BlockStatement mutant `Survived`]

Why the comment misses the block starting on the line below it was not established, so the same placement above `} finally {` or `} else {` is unverified.

## A `// Stryker disable BlockStatement` comment above a `try` statement ignores its try and catch blocks' BlockStatement mutants; a `// Stryker restore BlockStatement` written as the function body's last line did not end it, while one written below the function's closing `};` did

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-21
**Citation:** [mutant-triage_3: ran `npx stryker run --mutate platform/webPlatform.ts` in `app/` — observed with the restore as the body's last line every later BlockStatement mutant of the file `Ignored`, and with the restore below `};` only the try and catch blocks' mutants `Ignored`]

A restore that does not take effect fails silently: the mutants it should have reactivated show as `Ignored` in `reports/mutation/mutation.json`, not as an error.

## Stryker's `concurrency` option defaults to the logical core count, minus one when there are more than four cores

**Verified at:** `@stryker-mutator/core` 10.0.0, <https://stryker-mutator.io/docs/stryker-js/configuration/> — 2026-10-21
**Citation:** [instruction-pass_2: `https://stryker-mutator.io/docs/stryker-js/configuration/` — default `cpuCoreCount <= 4? cpuCoreCount : cpuCoreCount - 1`, described as the concurrency of workers]

With `app/stryker.config.json` setting no `concurrency`, a run on a multi-core machine tests several mutants at once, each in its own command run.

## Stryker's file crawl ignores `.gitignore` files, so without `ignorePatterns` it counts and copies a gitignored `app/src-tauri/target` into every sandbox, which cost about 50 s per run

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-25
**Citation:** [mutation-speed_1: `app/node_modules/@stryker-mutator/core/dist/src/fs/project-reader.js` — `resolveInputFileNames` crawls the directory tree with `ALWAYS_IGNORE`, `tempDirName`, the report file names and `ignorePatterns` as the only ignore rules, and reads no `.gitignore`] [mutation-speed_2: `app/node_modules/@stryker-mutator/core/schema/stryker-schema.json` — `ignorePatterns`: a pattern starting with `/` is relative to the current working directory, and the option has no effect with `inPlace`] [mutation-speed_3: ran `npx stryker run --mutate <file>:1-9 --ignorePatterns /src-tauri/target` in `app/` with a 54370-file `src-tauri/target` present — observed `Found 1 of 1054 file(s)` and `Done in 8 seconds`, against `Found 1 of 55424 file(s)` and `Done in 1 minute and 3 seconds` without the option]

`"ignorePatterns": ["/src-tauri/target"]` in `app/stryker.config.json` leaves the sandbox with the 1054 other files, and the tests still pass in it.

## Stryker sets `__STRYKER_ACTIVE_MUTANT__` to the mutant's id in the command runner's environment for each mutant run and leaves it unset during the initial dry run, and the instrumented file holds each of its mutants as a `stryMutAct_<hash>("<id>")` call

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-25
**Citation:** [mutation-speed_4: `app/node_modules/@stryker-mutator/core/dist/src/test-runner/command-test-runner.js:50-66` — `mutantRun` passes `activeMutant.id` to `run`, which adds the variable to `process.env` only when that id is not `undefined`] [mutation-speed_5: ran `npx stryker run --mutate <file>:1-9 --cleanTempDir false` in `app/` — observed in the sandbox copy of the file the calls `stryMutAct_9fa48("0")` to `stryMutAct_9fa48("4")` for its 5 mutants, and the files without mutants unchanged]

A command can therefore tell which file holds the active mutant by searching the files for that call; `scripts/mutation-check-related.ts` does, so one Stryker run covers all changed files and each mutant still runs only its own file's related tests. The call's name and the hash are Stryker-internal: a mutant found in no file runs no test and is reported as `Survived`.

## `vitest related <file>` runs every test file that imports the file transitively, which for a file reached through the `@domain` barrel was 82 test files and 19 s

**Verified at:** Vitest 5.0.2 — 2026-10-25
**Citation:** [mutation-speed_6: ran `npx vitest related --run --passWithNoTests --bail 1 --maxWorkers 1 domain/base-entity-content-sections/wholeNumberInput.ts` in `app/` — observed `Tests 264 passed (264)`, `jsdom was created 82 times` and `Duration 19.00s`]

The initial dry run and every surviving mutant of such a file pay this time; a killed mutant stops at its first failing test file because of `--bail 1`.

## A `// Stryker disable next-line ArrayDeclaration` comment written as the last statement of an `useEffect` callback, above `}, []);`, leaves the dependency array's mutant active; written between the call's arguments, directly above `[]`, it ignores it

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-29
**Citation:** [implementer_1: ran `pnpm run mutation-check -- app/src/screens/encounter/hooks/useEncounterSelection.ts` — observed the survivor `useEncounterSelection.ts:39:6 ArrayDeclaration` with the comment inside the callback body, and `mutation-check: passed` once the comment sat between the arguments of `useEffect(`]

This is the same placement limit the entry on the comment above `} catch {` records: a comment inside a block does not reach a mutant on the line after the block closes.

## A `// Stryker disable next-line StringLiteral` comment between the attributes of a JSX opening tag, directly above `className='…'`, ignores that attribute's StringLiteral mutant

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-29
**Citation:** [implementer_2: ran `pnpm run mutation-check` in the repository root on `EncounterQueueEntry.tsx` — observed `mutation-check: passed` with the comment above `className='encounter-queue-entry'` and above `className='encounter-queue-entry-tint'`, where the earlier run listed `StringLiteral → ""` survivors on both attribute lines]

The comment is a `//` line inside the tag, between two attributes.

## A `// Stryker disable next-line StringLiteral: <reason>` comment's mutant is listed in `mutation.json` with status `Ignored` and the reason as `statusReason` only when the mutant's line is inside the `--mutate` range

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-31
**Citation:** [implementer_3: ran `node scripts/mutation-check.ts` on a changed `util/getDateString.ts` whose line 5 was `// Stryker disable next-line StringLiteral: month text is unobservable` and whose line 6 was `month: 'long', // changed` (a trailing comment added only to make the line changed) — observed with `--mutate util/getDateString.ts:5-6` one `StringLiteral` mutant in `reports/mutation/mutation.json`, status `Ignored`, `statusReason` `month text is unobservable`, and with `util/getDateString.ts:5-5` `Instrumented 1 source file(s) with 0 mutant(s)` and an empty `files`]

A report therefore shows which files hold an ignored mutant, but not whether a test would kill it.

## Replacing `Stryker disable` with `Stryker_disable` inside a disable comment switches it off without moving any line or column, and the mutant it covered then runs at the same position

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-31
**Citation:** [implementer_4: `@stryker-mutator/instrumenter` `dist/src/transformers/directive-bookkeeper.js:46` — a comment is a directive only when its text matches `^\s?Stryker (disable|restore)…`] [implementer_5: ran `node scripts/mutation-check.ts` with that edit applied to a scratch copy of `util/getDateString.ts` — observed the `StringLiteral → ""` mutant at `6:12`, `Ignored` in the real run, `Killed` in the scratch run with `RangeError: Value  out of range for Date.prototype.toLocaleDateString options property month`] [implementer_6: ran `grep -n -i "directive\|disable-comment" app/node_modules/@stryker-mutator/core/schema/stryker-schema.json` — found only the `disableTypeChecks` description]

The configuration schema names no option that turns the comments off, so the comment text is the switch.

## A Stryker run with its working directory a copy of `app/` under the OS temp directory, made without `node_modules`, `reports`, `.stryker-tmp` and `src-tauri/target` and with `node_modules` a symlink to `app/node_modules`, finds its dependencies, passes its initial test run and kills a mutant

**Verified at:** `@stryker-mutator/core` 10.0.0, pnpm 12.4.2 — 2026-10-31
**Citation:** [implementer_5: ran `node scripts/mutation-check.ts`, which started `npx stryker run --mutate util/getDateString.ts:5-6` with that copy (`cpSync` into `mkdtemp(os.tmpdir() + "/mutation-check-audit-")`, then `symlinkSync(<app>/node_modules, <copy>/node_modules, "dir")`) as working directory — observed `Initial test run succeeded`, the mutant `Killed`, and the run `Done` in about 14 seconds]

## Stryker creates no StringLiteral mutant for the object property value `'long' as const`

**Verified at:** `@stryker-mutator/core` 10.0.0 — 2026-10-31
**Citation:** [implementer_3: ran `node scripts/mutation-check.ts` on `util/getDateString.ts:5-6` with the line `month: 'long' as const,` under a `Stryker disable next-line StringLiteral` comment — observed `Instrumented 1 source file(s) with 0 mutant(s)` in both the real run and the run with the comment switched off, where `month: 'long', // changed` yielded the `StringLiteral → ""` mutant]

Whether the same holds for a literal in another position under `as const` was not established.
