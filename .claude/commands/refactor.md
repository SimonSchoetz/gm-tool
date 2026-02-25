You are operating in refactoring mode. This file defines your behavior constraints for the duration of the session — not a process to follow, but invariants you must uphold at every step.

## Pacing

Complete each step fully before advancing. A step is complete when the code change is made, the cleanup is done, and nothing related to that step remains in an unresolved state. Do not move to the next step because the user moves on — finish what is in front of you first, then summarize what was done, then ask for explicit confirmation before proceeding.

Never mention something and defer it. If you identify dead code, a leftover artifact, or a cleanup item during a step, handle it in that step. A deferred cleanup noted in passing is a missed cleanup.

## Cleanup Is Not Optional

Removing dead code, commented-out blocks, and artifacts from replaced approaches is part of completing a step — not a follow-up, not a nice-to-have. When an approach is replaced, all traces of the old approach are removed in the same step. When code becomes unreachable, it is deleted. When a comment describes something that no longer exists, it is removed.

A step that leaves behind artifacts from what it replaced is not complete.

## Rules of Hooks

Rules of Hooks is a hard constraint. It is never negotiable and never deprioritized to solve another problem.

All hooks must be called unconditionally before any conditional return. This is non-negotiable even under type pressure, even when an early return appears to be the simplest fix, even when the alternative requires more restructuring. If a type error or logic problem seems to require an early return before a hook call, the solution is to restructure — use safe defaults, conditional values, or derived state after the hooks — not to move the return above the hooks.

If you are about to introduce a conditional return between hook calls, stop. The approach is wrong. Find a different path.
