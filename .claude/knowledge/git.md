# Git

## In a linked worktree under `extensions.worktreeConfig`, a `core.hooksPath` set only in that worktree's `.git/worktrees/<id>/config.worktree` is listed by `git config --show-origin --get-all core.hooksPath` run there and not by `git config --local core.hooksPath`, which reads only `.git/config`

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [claude_5: ran `man -M "$(git --man-path)" -P cat git-config` — observed under `--local` "For reading options: read only from the repository .git/config rather than from all available files", and under `--worktree` "Similar to --local except that $GIT_DIR/config.worktree is read from or written to if extensions.worktreeConfig is enabled"] [claude_10: ran `git config --show-origin --get-all core.hooksPath` from the linked worktree `/Users/simonschoetz/dev/gm-tool/.claude/worktrees/clever-payne-354010` — observed one line whose origin is `file:/Users/simonschoetz/dev/gm-tool/.git/worktrees/clever-payne-354010/config.worktree`] [claude_11: ran `git config --local core.hooksPath` from the same worktree — observed no output and exit code 1] [claude_12: `/Users/simonschoetz/dev/gm-tool/.git/config:14-15` — `[extensions]` `worktreeConfig = true`] [claude_13: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

The same two commands run from the main checkout were not probed.

## `git -c core.hooksPath=<absolute dir>` made a `git commit` run that directory's `pre-commit` and a `git push` run its `pre-push`, in a linked worktree whose configured `core.hooksPath` names another directory

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [claude_14: ran `git -c core.hooksPath=/Users/simonschoetz/dev/gm-tool/.git/hooks commit -q -m "scratch: must be blocked"` from the linked worktree `/Users/simonschoetz/dev/gm-tool/.claude/worktrees/clever-payne-354010`, whose `config.worktree` then set `core.hooksPath` to `/Users/simonschoetz/dev/gm-tool/.husky`, with `app/src/zz-scratch.ts` containing `export const broken: number = 'not a number';` staged — observed the `pre-commit` script of `/Users/simonschoetz/dev/gm-tool/.git/hooks` run (its `tsc` step printed `error TS2322` for that line), the command exit non-zero and `HEAD` unchanged] [claude_15: ran `git init -q --bare <scratch dir>/demo-remote.git` and then `git -c core.hooksPath=/Users/simonschoetz/dev/gm-tool/.git/hooks push <scratch dir>/demo-remote.git HEAD:refs/heads/demo` from the same worktree, with that `config.worktree` setting still in place (`git config --show-origin --get-all core.hooksPath` run after both commands printed the same single line) — observed the `pre-push` script of that directory run `vitest` (`Test Files  145 passed`) before `* [new branch]  HEAD -> demo` appeared] [claude_13: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

Whether the configured directory's hooks also ran was not observed.

## `git rev-parse --git-path hooks` printed the absolute `core.hooksPath` a linked worktree's `config.worktree` set, the common `.git/hooks` in that worktree once the setting was unset, and `.git/hooks` in the main checkout

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [claude_19: ran `git rev-parse --git-path hooks` in the linked worktree `/Users/simonschoetz/dev/gm-tool/.claude/worktrees/clever-payne-354010` while its `config.worktree` set `core.hooksPath` to `/Users/simonschoetz/dev/gm-tool/.husky` — observed that path; ran it there again after `git config --worktree --unset core.hooksPath` — observed `/Users/simonschoetz/dev/gm-tool/.git/hooks`; ran it in the main checkout `/Users/simonschoetz/dev/gm-tool` — observed `.git/hooks`, and `git config --show-origin --get-all core.hooksPath` there — observed no output and exit code 1] [claude_13: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

The command prints the directory and says nothing about which hook files it holds.

## `git hook run pre-commit` ran the hook (its type-check, lint and format steps ran, exit 0) when the resolved hooks directory held one, and exited 1 with `error: cannot find a hook named pre-commit` when it held none

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [claude_20: ran `git hook run pre-commit` in the linked worktree `/Users/simonschoetz/dev/gm-tool/.claude/worktrees/clever-payne-354010` while its `config.worktree` set `core.hooksPath` to `/Users/simonschoetz/dev/gm-tool/.husky`, a directory holding no `pre-commit` file — observed `error: cannot find a hook named pre-commit` and exit code 1; ran it there again after `git config --worktree --unset core.hooksPath`, when `git rev-parse --git-path hooks` printed `/Users/simonschoetz/dev/gm-tool/.git/hooks` and that directory held `pre-commit` — observed that script run its type-check, lint and format steps and exit 0] [claude_13: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

The command is not a dry run: the hook's steps execute.
