# Testing Library

## `waitFor` treats timers as real unless a `jest` global exists, so under Vitest's fake timers it re-checks a `renderHook` test only when the test advances timers

**Verified at:** @testing-library/dom 10.4.1, vitest 5.0.1, read 2026-09-21
**Citation:** [review-decision_17: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/helpers.js:14-28 — `jestFakeTimersAreEnabled()` returns `false` when `typeof jest` is `'undefined'`] [review-decision_18: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:40, 91-97 — on that path `waitFor` arms its overall timeout with `setTimeout`, polls with `setInterval`, and otherwise re-checks only from a `MutationObserver` on its container] [spec-writer_29: app/node_modules/vitest/dist/chunks/constants.-juJ8b_4.js:16 — `globalApis` lists no `jest`]

With `vi.useFakeTimers()` faking `setTimeout` and `setInterval`, `waitFor` neither polls nor times out until the test advances timers, and a `renderHook` container never mutates, so nothing re-checks the callback. A hook test under fake timers settles with `vi.advanceTimersByTimeAsync` instead (`.claude/knowledge/vitest.md`).

## A user-event click on a button leaves focus where it was when the button's `mousedown` handler calls `preventDefault()`, and moves focus to the button otherwise

**Verified at:** @testing-library/user-event 14.6.7, read and run 2026-10-20
**Citation:** [instruction-pass_1: app/node_modules/@testing-library/user-event/dist/esm/system/pointer/mouse.js:63-75 — `down()` calls `this.startSelecting(...)` and `focusElement(target)` only inside `if (!isPrevented && (disabled || instance.dispatchUIEvent(target, 'mousedown', init)))`] [instruction-pass_2: ran `npx vitest run` from `app/` on a scratch test rendering an input and a button whose `onMouseDown` calls `e.preventDefault()`, with `userEvent.setup()` clicking the input, then the button — observed the input keeping focus, and the button taking focus once the handler no longer called `preventDefault()`; scratch deleted]

A test therefore observes a `mousedown` handler's `preventDefault()` through a user-event click, as focus staying on the element that held it.

## user-event 14.6.7 has no method for `wheel`

**Verified at:** @testing-library/user-event 14.6.7, read 2026-10-20
**Citation:** [instruction-pass_3: grep -rn wheel app/node_modules/@testing-library/user-event/dist — not found; the same tree's grep for `mousedown` found `dist/esm/system/pointer/mouse.js`]

A wheel interaction in a test is dispatched with Testing Library's `fireEvent.wheel` instead.

## `fireEvent.wheel(element, { deltaY })` dispatches a cancelable `WheelEvent` whose `deltaY` reaches a listener on an ancestor

**Verified at:** @testing-library/dom 10.4.1, read and run 2026-10-20
**Citation:** [instruction-pass_4: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/event-map.js:359-366 — `wheel: { EventType: 'WheelEvent', defaultInit: { bubbles: true, cancelable: true, composed: true } }`] [instruction-pass_5: ran `npx vitest run` from `app/` on `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/__tests__/ImagePreviewFramingOverlay.test.tsx` as of c78968ca, which calls `fireEvent.wheel` on an `<img>` with `{ deltaY: -100 }` inside a `<div>` whose native `wheel` listener lowers the zoom by `deltaY` times a step — observed the zoom passed to the mocked save rise above the starting zoom of 2, and fall to 1.9 (`expected 1.9 to be greater than 2`) with the listener's sign inverted]

The event's `deltaY` sign therefore reaches a handler intact, so a test can scroll up with a negative `deltaY`.

## `fireEvent` returns `dispatchEvent`'s result through `@testing-library/react`'s `act` wrapper: on a cancelable event, `false` when a listener called `preventDefault()` and `true` when none did

**Verified at:** @testing-library/dom 10.4.1, @testing-library/react 16.3.3, read and run 2026-10-20
**Citation:** [instruction-pass_6: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/events.js:11-20 — `fireEvent` returns `getConfig().eventWrapper(() => element.dispatchEvent(event))`; app/node_modules/@testing-library/react/dist/pure.js:105-115 — `eventWrapper` runs the callback inside `act` and returns its result] [instruction-pass_7: ran `npx vitest run` from `app/` on `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/__tests__/ImagePreviewFramingOverlay.test.tsx` as of c78968ca — observed `expect(fireEvent.wheel(...)).toBe(false)` pass with the overlay's `wheel` listener calling `e.preventDefault()`, and fail with `expected true to be false` once that call was removed]

A `wheel` handler's `preventDefault()` is therefore observable in a test through this return value.

## Under `vi.useFakeTimers()`, an awaited user-event click times out, with or without `advanceTimers: vi.advanceTimersByTime`; under `vi.useFakeTimers({ shouldAdvanceTime: true })` it resolves

**Verified at:** @testing-library/user-event 14.6.7, @testing-library/react 16.3.3, vitest 5.0.2, read and run 2026-10-20
**Citation:** [instruction-pass_8: app/node_modules/@testing-library/user-event/dist/esm/setup/wrapAsync.js:6 — every API call runs through `getConfig().asyncWrapper`; app/node_modules/@testing-library/react/dist/pure.js:84-100 — `asyncWrapper` awaits a `setTimeout(..., 0)` and advances it only through `jest.advanceTimersByTime(0)` when `jestFakeTimersAreEnabled()`] [instruction-pass_9: ran `npx vitest run` from `app/` on a scratch test clicking a button through user-event — observed a timeout under `vi.useFakeTimers()` with `userEvent.setup()` and with `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`; under `vi.useFakeTimers({ shouldAdvanceTime: true })` with `userEvent.setup()` the click resolved, a 600 ms `setTimeout` its handler started had not fired by then, and `await act(() => vi.runOnlyPendingTimersAsync())` fired it; scratch deleted]

The `setTimeout` that `asyncWrapper` awaits is advanced only through a `jest` global, which the `waitFor` entry above finds absent from Vitest's globals.
