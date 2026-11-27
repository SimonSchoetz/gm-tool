---
paths: ["package.json", ".githooks/**"]
---

# Git hooks

Conventions for a change to the `simple-git-hooks` block of the root `package.json` or to the scripts in `.githooks/` it runs. The hooks are written into the hooks directory every checkout of this repository shares, so an installed hook also runs in checkouts whose tree lacks the script it calls [head-of-instructions_1: `.claude/knowledge/simple-git-hooks.md` — the entry beginning "simple-git-hooks 2.14.0 writes each configured hook into the directory"].

## A change to the hook block names `pnpm run prepare` in its handoff

A change to the block reaches an existing checkout only when `pnpm run prepare` runs there: `pnpm install` into an up-to-date `node_modules` does not run the `prepare` script that installs the hooks, and only an install into a missing `node_modules` does [head-of-instructions_2: `.claude/knowledge/pnpm.md` — the entry beginning "pnpm 12.4.2 ran the project's own `prepare` script under `pnpm install --frozen-lockfile` into a missing `node_modules`, and did not run it"]. The message that reports the change to the user therefore names `pnpm run prepare` as the step that brings it into each existing checkout, and says that a checkout cut before the change merges the change first. `prepare` deletes each file in the shared hooks directory that is a valid git hook name and that the running checkout's block does not list (unless the block's `preserveUnused` names it), without a message naming it, so `prepare` run from an older checkout removes the new hook for every checkout sharing the directory [head-of-instructions_3: `.claude/knowledge/simple-git-hooks.md` — the entry beginning "simple-git-hooks 2.14.0 deletes a file in the hooks directory it writes to"].

## A hook entry that calls a script the change adds runs the command only where the script exists

Because the hooks directory is shared, a checkout cut before the change runs the new hook without having the script. The entry guards its command so it does nothing there: the `commit-msg` entry is `[ ! -f scripts/commit-msg-check.ts ] || node scripts/commit-msg-check.ts "$1"` [head-of-instructions_4: `package.json:40` — as of 5acd895a].
