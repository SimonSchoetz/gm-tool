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
