# Git

## In a linked worktree under `extensions.worktreeConfig`, a `core.hooksPath` set only in that worktree's `.git/worktrees/<id>/config.worktree` is listed by `git config --show-origin --get-all core.hooksPath` run there and not by `git config --local core.hooksPath`, which reads only `.git/config`

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [claude_5: ran `man -M "$(git --man-path)" -P cat git-config` — observed under `--local` "For reading options: read only from the repository .git/config rather than from all available files", and under `--worktree` "Similar to --local except that $GIT_DIR/config.worktree is read from or written to if extensions.worktreeConfig is enabled"] [claude_10: ran `git config --show-origin --get-all core.hooksPath` from the linked worktree `/Users/simonschoetz/dev/gm-tool/.claude/worktrees/clever-payne-354010` — observed one line whose origin is `file:/Users/simonschoetz/dev/gm-tool/.git/worktrees/clever-payne-354010/config.worktree`] [claude_11: ran `git config --local core.hooksPath` from the same worktree — observed no output and exit code 1] [claude_12: `/Users/simonschoetz/dev/gm-tool/.git/config:14-15` — `[extensions]` `worktreeConfig = true`] [claude_13: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

A read of `core.hooksPath` with `--local` therefore misses a value set for one worktree this way.

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

That error was printed for a resolved directory without the hook.

## `git merge --no-ff` ran `.git/hooks/pre-merge-commit` and not `.git/hooks/pre-commit` for the merge commit it created

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [claude_1: ran `git merge --no-ff -q -m merge side` in a scratch repository made with `git init`, holding one base commit and one commit on `side`, whose `.git/hooks` held an executable `pre-merge-commit` printing `PRE-MERGE-COMMIT HOOK RAN` and an executable `pre-commit` printing `PRE-COMMIT HOOK RAN` — observed only `PRE-MERGE-COMMIT HOOK RAN`] [claude_2: ran `git merge --no-ff -m "Merge branch 'feat/content-sections' into main" feat/content-sections` in `/Users/simonschoetz/dev/gm-tool` while `.git/hooks` held `pre-commit`, whose `prettier --check` step prints `Checking formatting...`, and no `pre-merge-commit` — observed no hook output and merge commit `616efec9` created] [claude_3: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

Whether `git merge --squash` or `git rebase` runs either hook, and whether a `core.hooksPath` set in a linked worktree changes which directory's hook runs, was not probed.

## A merge that stopped on conflicts and was finished with `git commit` ran `.git/hooks/pre-commit`

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [claude_4: after `git merge claude/clever-payne-354010` in `/Users/simonschoetz/dev/gm-tool` stopped on conflicts, ran `git commit -q -m …` there while `.git/hooks` held `pre-commit`, whose `prettier --check` step prints `Checking formatting...`, and no `pre-merge-commit` — observed `Checking formatting...` printed before merge commit `36516392` was created] [claude_3: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

Whether `pre-merge-commit`, when installed, also runs for a merge commit made this way was not probed.

## Inside `pre-commit`, `git diff --cached --name-only` listed the files `git commit -a` and `git commit <path>` were about to commit although they were never staged; inside `pre-merge-commit` for a conflict-free `git merge --no-ff`, it listed the paths the merged branch brought in and not those only the current branch had changed

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [harness-follow-ups_3: in a scratch repository made with `git init`, holding `app/a.txt` and `docs/d.txt`, whose `pre-commit` and `pre-merge-commit` hooks printed `git diff --cached --name-only` — observed `docs/d.txt` for a commit with only that file staged; `app/a.txt` for `git commit -qam c3` and for `git commit -qm c4 app/a.txt`, each run with `app/a.txt` modified and unstaged; for `git merge --no-ff -q -m merge side`, where `side` added `app/b.txt` and `main` had meanwhile changed only `docs/d.txt`, `app/b.txt` and not `docs/d.txt` in `pre-merge-commit`] [harness-follow-ups_4: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

What it lists for `git commit --amend`, and in `pre-commit` for a merge finished with `git commit` after conflicts, was not probed.

## With `diff.renames` unset, `git diff --cached --name-only` listed a staged `git mv` of an unchanged file only under its new path; with `--no-renames` it listed the old path and the new one

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-19
**Citation:** [harness-follow-ups_5: in a scratch repository made with `git init`, where `git config --show-origin --get-all diff.renames` printed nothing, after `git mv app/a.txt docs/a.txt` with no content change, a `pre-commit` hook printing both commands — observed `docs/a.txt` for `git diff --cached --name-only` and `app/a.txt docs/a.txt` for `git diff --cached --name-only --no-renames`] [harness-follow-ups_4: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

A path filter on the first form misses a file moved out of the filtered directory.

## In a non-bare repository, git runs a hook with the root of the working tree as its working directory, a linked worktree's root included, except `pre-receive`, `update`, `post-receive`, `post-update` and `push-to-checkout`, which run in `$GIT_DIR`

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-10-20
**Citation:** [migration-backup_15: ran `man -M "$(git --man-path)" -P cat githooks` — observed "Before Git invokes a hook, it changes its working directory to either $GIT_DIR in a bare repository or the root of the working tree in a non-bare repository. An exception are hooks triggered during a push (pre-receive, update, post-receive, post-update, push-to-checkout) which are always executed in $GIT_DIR."] [migration-backup_16: in a scratch repository made with `git init` plus a linked worktree made with `git worktree add`, whose main `.git/hooks/pre-commit` wrote `pwd` to a file, ran `git commit` from the worktree's subdirectory `sub/deeper` — observed the linked worktree's root] [migration-backup_17: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

A hook that starts there can therefore name a file of the checked-out tree by a path relative to that root.

## git 2.54.0 ran the `commit-msg` hook for a merge made by `git merge` and not for the commit `git revert --no-edit` made

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-11-27
**Citation:** [implement_1: ran `man -M "$(git --man-path)" -P cat githooks` — observed under `commit-msg` "This hook is invoked by git-commit(1) and git-merge(1), and can be bypassed with the --no-verify option."] [implement_2: in a scratch repository whose `commit-msg` and `prepare-commit-msg` hooks each logged the message file's first line, ran `git merge --no-edit a b` — observed a `commit-msg` line — and `git revert --no-edit HEAD` — observed only the `prepare-commit-msg` line] [implement_10: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

`git revert` with an editor was not probed.

## git 2.54.0 wrote default merge subjects that begin with the word `Merge`, then `branch`, `remote-tracking branch`, `tag` or `commit`, singular or plural, and a quoted name, and wrote `Merge <repository path>` for a `git pull` of a repository path with no branch

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-11-27
**Citation:** [implement_3: in a scratch repository, ran `git merge --no-edit` with two local branches, two remote-tracking branches, two tags, two commit ids, a branch and a tag, and two branches while on `feat/dest`, then `git pull --no-rebase --no-edit` of a repository path with two commit ids and with no branch — observed `Merge branches 'a' and 'b'`, `Merge remote-tracking branches 'up/c' and 'up/d'`, `Merge tags 't1' and 't2'`, `Merge commit '<id>'; commit '<id>'`, `Merge branch 'i', tag 't1'`, `Merge branches 'a' and 'b' into feat/dest`, `Merge commits '<id>' and '<id>' of <repository path>` and `Merge <repository path>`] [architect_4: ran `git merge` of a remote-tracking branch, a tag, a bare commit id and a local branch — observed subjects `Merge remote-tracking branch 'up/o'`, `Merge tag 't'`, `Merge commit '<sha>'`, `Merge branch 'o'`] [implement_10: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

The merge of a branch and a tag wrote `Merge branch 'i', tag 't1'`, which begins with the branch form.

## git 2.54.0 records `Squashed commit of the following:` as the subject when `git commit --no-edit` finishes a `git merge --squash`

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-11-27
**Citation:** [implement_4: in a scratch repository, ran `git merge --squash a` and then `git commit --no-edit` — observed that subject] [implement_12: in a second scratch repository, ran `git merge --squash side`, `git commit --no-edit` and `git log -1 --format=%P` — observed one parent id] [implement_10: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

That commit had one parent.

## git 2.54.0 wrote `Revert "<subject>"` as a revert's default subject and `Reapply "<subject>"` for a revert of that revert

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-11-27
**Citation:** [implement_11: in a scratch repository, ran `git revert --no-edit HEAD` on the commit `update backlog` and then again on the commit that made — observed `Revert "update backlog"` and then `Reapply "update backlog"`] [implement_10: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

Both quoted the subject of the commit reverted first.

## git invokes its commit hooks with `GIT_EDITOR=:` when the command opens no editor

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-11-27
**Citation:** [implement_6: ran `man -M "$(git --man-path)" -P cat githooks` — observed "All the git commit hooks are invoked with the environment variable GIT_EDITOR=: if the command will not bring up an editor to modify the commit message."] [implement_7: in a scratch repository whose `commit-msg` hook printed `$GIT_EDITOR`, with `GIT_EDITOR` unset outside git — observed `:` for `git commit -m` and `git merge --no-ff --no-edit`, and an empty value for a commit written through `core.editor`] [implement_10: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

A commit written through `core.editor`, with `GIT_EDITOR` unset in the calling shell, reached `commit-msg` with an empty value.

## Under its default cleanup, git 2.54.0 keeps a leading `#` line as the subject of a `git commit -m` message

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-11-27
**Citation:** [implement_8: ran `man -M "$(git --man-path)" -P cat git-commit` — observed under `--cleanup` that `default` is "Same as strip if the message is to be edited. Otherwise whitespace." and that `whitespace` is "Same as strip except #commentary is not removed."] [implement_9: in a scratch repository, ran `git commit -m "#12 broken subject" -m "feat(hash): body line"` — observed the recorded subject `#12 broken subject`] [implement_10: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

An edited message is cleaned with `strip`, which removes `#` lines, so there such a line is a comment and not the subject.

## `git revert --no-edit` ran the `prepare-commit-msg` hook with the source `message`

**Verified at:** git 2.54.0 (Apple Git-157) — 2026-11-27
**Citation:** [implement_1: in a scratch repository whose `prepare-commit-msg` hook logged its second argument and the message file's first line, ran `git revert --no-edit HEAD` on the commit `feat(x): a` — observed the source `message` and the line `Revert "feat(x): a"`] [implement_2: ran `git --version` — observed `git version 2.54.0 (Apple Git-157)`]

For this revert the hook received `message`, none of `merge`, `squash` and `commit`.
