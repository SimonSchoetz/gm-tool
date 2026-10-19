# simple-git-hooks

## simple-git-hooks 2.14.0 writes each configured hook into the directory `git config --local core.hooksPath` prints, or into `<common git dir>/hooks` when that prints nothing, resolving a worktree's `.git` file through its `commondir`

**Verified at:** simple-git-hooks 2.14.0 — 2026-10-19
**Citation:** [claude_7: `node_modules/simple-git-hooks/simple-git-hooks.js:47-78` — `getGitProjectRoot` follows a `gitdir:` file and, when a `commondir` file exists in that directory, returns the common directory; `:158-173` — `_getHooksDirPath` runs `git config --local core.hooksPath` in the directory holding the `package.json`, returns `<gitRoot>/hooks` when that prints nothing or fails, and otherwise the printed path, made absolute against that directory when relative; `:174-200` — `_setHook` writes `<hooks dir>/<hook>` and sets mode `0755`] [claude_8: ran `pnpm install --frozen-lockfile` at the root of the linked worktree `.claude/worktrees/clever-payne-354010`, whose `.git` is a file naming a `gitdir` under the main repository's `.git/worktrees/`, and where `git config --local core.hooksPath` printed nothing and exited 1 — observed `[INFO] Successfully set the pre-commit with command: …` and the same for `pre-push`, and `pre-commit` and `pre-push` present afterwards in the main repository's `.git/hooks/`, which beforehand held only `prepare-commit-msg` and the `*.sample` files]

## simple-git-hooks 2.14.0 deletes a file in the hooks directory it writes to whose name is a valid git hook but which the configuration does not list, unless `preserveUnused` names it or is `true`

**Verified at:** simple-git-hooks 2.14.0 — 2026-10-19
**Citation:** [claude_9: `node_modules/simple-git-hooks/simple-git-hooks.js:144` — a non-array truthy `preserveUnused` expands to every valid hook name; `:145-153` — for every name in `VALID_GIT_HOOKS` that the configuration lacks and `preserveUnused` does not list, `setHooksFromConfig` calls `_removeHook`; `:222-235` — `_removeHook` resolves the same hooks directory and unlinks `<hooks dir>/<hook>` when it exists]
