# Dependabot

## Dependabot's `npm` ecosystem covers pnpm v7 to v12

**Verified at:** <https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories — the table row for pnpm lists the `package-ecosystem` value `npm` and the versions v7, v8, v9, v10, v11, v12]

No Dependabot run was observed; the page is the only source.

## Dependabot raises alerts on this repository's pnpm 12 lockfiles written as two YAML documents, and opens security-update pull requests against `/app`, though its documentation says it does neither for that format

**Verified at:** GitHub, `SimonSchoetz/gm-tool` — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories — the pnpm note: "When pnpm writes pnpm-lock.yaml as two YAML documents, the dependency graph does not detect the dependencies in that file. This is the default format for pnpm 12 projects that pin a pnpm version. Dependabot version updates still work, but Dependabot alerts and Dependabot security updates are not created for those dependencies, and existing alerts for them may close."] [refine_1: ran `git show a548f3f4:pnpm-lock.yaml | grep -c '^---'` and the same for `app/pnpm-lock.yaml`, `a548f3f4` being `main` from 12:26 UTC until after the alerts were created — observed 2 for each] [refine_2: ran `gh api repos/SimonSchoetz/gm-tool/dependabot/alerts --paginate` — observed 33 npm alerts, all created 2026-11-19 between 12:38:32 and 12:38:39 UTC, 28 on `app/pnpm-lock.yaml` and 5 on `pnpm-lock.yaml`] [refine_3: ran `gh api graphql` for `dependencyGraphManifests` — observed `pnpm-lock.yaml` and `app/pnpm-lock.yaml` listed, both `parseable: true`] [refine_4: ran `gh run view --log` on the Dependabot Updates runs 44535080192 (seroval) and 44538375222 (brace-expansion) — observed `"command":"security"` in each job definition; ran `gh pr view 29` and `gh pr view 31` — observed the heads `dependabot/npm_and_yarn/app/seroval-1.8.2` and `dependabot/npm_and_yarn/app/brace-expansion-5.0.13`]

The alerts were created while both lockfiles were in the two-document format, so the documentation's pnpm note does not hold for this repository. Security-update jobs also ran for the root `pnpm-lock.yaml`, but none of them has opened a pull request so far.

## A Dependabot security update of a transitive pnpm dependency was seen failing without a pull request in two ways: no patched version installable, and pnpm resolving above the requested version

**Verified at:** GitHub, `SimonSchoetz/gm-tool` — 2026-11-19
**Citation:** [refine_5: ran `gh run view 44538698696 --log` — observed "The latest possible version of qs that can be installed is 6.15.1", followed by a POST to `record_update_job_error`] [refine_6: ran `gh run view 44538698670 --log` — observed "Handled error whilst updating source-map-js: dependency_file_not_resolvable {message: "pnpm resolved source-map-js to 1.2.4, above the requested 1.2.2. It is not a direct dependency, so pnpm updates it to what a fresh install would resolve rather than to the requested version."}"] [refine_7: ran `gh run list --workflow "Dependabot Updates"` — observed both runs with conclusion `failure`; ran `gh api repos/SimonSchoetz/gm-tool/dependabot/alerts` — observed qs alert 20 (transitive, first patched 6.16.1) and source-map-js alert 7 (transitive, first patched 1.2.2) open; ran `gh pr list --state all --author app/dependabot` — observed no pull request for either package]

For qs, the installable maximum of 6.15.1 lies below the alert's first patched version, 6.16.1. For source-map-js, the patched version was installable, but pnpm would have moved the transitive dependency past it to 1.2.4, and Dependabot refused that. Both are single observations, not documented rules for when a security update fails.

## Dependabot's `vendor` option is supported by `bundler` and `gomod` only, so a `cargo` entry cannot use it

**Verified at:** <https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference — the `vendor` option: "Supported by: bundler and gomod only"]

No Dependabot run was observed; the page is the only source.

## `cooldown.default-days` is supported for every package manager the options reference lists, among them GitHub Actions, Cargo and NPM

**Verified at:** <https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference — the `cooldown` section: "The `default-days` option is supported for all package managers listed", the list including GitHub Actions, Cargo and NPM and Yarn]

The page's support table for the `semver-major-days`, `semver-minor-days` and `semver-patch-days` keys was not read in a form that shows which package managers it marks.

## A Dependabot group that sets `patterns` and `update-types` takes only those semver levels, and every other update stays an individual pull request

**Verified at:** <https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/optimizing-pr-creation-version-updates> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/optimizing-pr-creation-version-updates — Example 3, a group `angular` with `patterns: ["@angular*"]` and `update-types: ["minor", "patch"]`: "All major updates will continue to be raised as individual pull requests"] [implement_2: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference — `groups`: "Any outdated dependencies that do not match a rule are updated in individual pull requests"]

No Dependabot run was observed; the two pages are the only sources.

## Dependabot creates no alerts for a GitHub Action that is pinned to a SHA value

**Verified at:** <https://docs.github.com/en/actions/reference/security/secure-use> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/actions/reference/security/secure-use — "Monitoring the actions in your workflows": "Dependabot only creates alerts for vulnerable actions that use semantic versioning and will not create alerts for actions pinned to SHA values."]

No Dependabot run was observed; the page is the only source.

## Dependabot updates the version comment on the same line as a GitHub Action's `uses`, and moves a commit that no tag points to to the latest commit, which might differ from the latest release

**Verified at:** <https://docs.github.com/en/actions/reference/security/secure-use> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/actions/reference/security/secure-use — "Dependabot updates the version documentation of GitHub Actions when the comment is on the same line, such as `actions/checkout@<commit> #<tag or link>` or `actions/checkout@<tag> #<tag or link>`. If the commit you use is not associated with any tag, Dependabot will update the GitHub Actions to the latest commit (which might differ from the latest release)."]

No Dependabot run was observed; the page is the only source.
