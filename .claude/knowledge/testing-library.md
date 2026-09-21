# Testing Library

## `waitFor` treats timers as real unless a `jest` global exists, so under Vitest's fake timers it re-checks a `renderHook` test only when the test advances timers

**Verified at:** @testing-library/dom 10.4.1, vitest 5.0.1, read 2026-09-21
**Citation:** [review-decision_17: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/helpers.js:14-28 — `jestFakeTimersAreEnabled()` returns `false` when `typeof jest` is `'undefined'`] [review-decision_18: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:40, 91-97 — on that path `waitFor` arms its overall timeout with `setTimeout`, polls with `setInterval`, and otherwise re-checks only from a `MutationObserver` on its container] [spec-writer_29: app/node_modules/vitest/dist/chunks/constants.-juJ8b_4.js:16 — `globalApis` lists no `jest`]

With `vi.useFakeTimers()` faking `setTimeout` and `setInterval`, `waitFor` neither polls nor times out until the test advances timers, and a `renderHook` container never mutates, so nothing re-checks the callback. A hook test under fake timers settles with `vi.advanceTimersByTimeAsync` instead (`.claude/knowledge/vitest.md`).
