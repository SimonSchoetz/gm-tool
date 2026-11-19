# Dependabot

## Dependabot's `npm` ecosystem covers pnpm v7 to v12

**Verified at:** <https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories — the table row for pnpm lists the `package-ecosystem` value `npm` and the versions v7, v8, v9, v10, v11, v12]

No Dependabot run was observed; the page is the only source.

## For a pnpm lockfile written as two YAML documents, Dependabot version updates work but no alerts or security updates are created

**Verified at:** <https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories> — 2026-11-19
**Citation:** [implement_1: https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories — the pnpm note: "When pnpm writes pnpm-lock.yaml as two YAML documents, the dependency graph does not detect the dependencies in that file. This is the default format for pnpm 12 projects that pin a pnpm version. Dependabot version updates still work, but Dependabot alerts and Dependabot security updates are not created for those dependencies, and existing alerts for them may close."]

No Dependabot run was observed; the page is the only source.

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
