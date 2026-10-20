# Testing Library

## `waitFor` treats timers as real unless a `jest` global exists, so under `vi.useFakeTimers()` with no options it re-checks a `renderHook` test only when the test advances timers

**Verified at:** @testing-library/dom 10.4.1, @testing-library/react 16.3.3, vitest 5.0.2, read 2026-10-20
**Citation:** [instruction-pass_1: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/helpers.js:14-28 — `jestFakeTimersAreEnabled()` returns `false` when `typeof jest` is `'undefined'`] [instruction-pass_2: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:40, 91-97 — on that path `waitFor` arms its overall timeout with `setTimeout`, polls with `setInterval`, and otherwise re-checks only from a `MutationObserver` on its container; wait-for.js:15 — the container defaults to the document] [instruction-pass_3: app/node_modules/vitest/dist/chunks/constants.-juJ8b_4.js:16 — `globalApis` lists no `jest`] [instruction-pass_4: app/node_modules/vitest/dist/chunks/defaults.D2ip7f-X.js:46-49 — Vitest's default `fakeTimers` config sets neither `toFake` nor `shouldAdvanceTime`; app/node_modules/vitest/dist/chunks/index.DGdajAO2.js:7246-7254, 6820-6845 — `vi.useFakeTimers()` merges that config with its own argument and, given neither `toFake` nor `toNotFake`, installs fake-timers faking every timer except `nextTick` and `queueMicrotask`; index.DGdajAO2.js:6331, 6397 — `install` sets `shouldAdvanceTime` to `false` unless given, and only `true` makes the clock tick on its own] [instruction-pass_9: app/node_modules/@testing-library/react/dist/pure.js:336-344 — `renderHook`'s `TestComponent` calls the hook and returns `null`]

With `vi.useFakeTimers()` faking `setTimeout` and `setInterval` and its clock moving only when the test advances it, `waitFor` neither polls nor times out until then, and a `renderHook` test renders nothing into the document, so nothing re-checks the callback. A hook test under fake timers settles with `vi.advanceTimersByTimeAsync` instead (`.claude/knowledge/vitest.md`).

## A user-event click on a button leaves focus where it was when the button's `mousedown` handler calls `preventDefault()`, and moves focus to the button otherwise

**Verified at:** @testing-library/user-event 14.6.7, read and run 2026-10-20
**Citation:** [instruction-pass_1: app/node_modules/@testing-library/user-event/dist/esm/system/pointer/mouse.js:63-75 — `down()` calls `this.startSelecting(...)` and `focusElement(target)` only inside `if (!isPrevented && (disabled || instance.dispatchUIEvent(target, 'mousedown', init)))`] [instruction-pass_2: ran `npx vitest run` from `app/` on a scratch test rendering an input and a button whose `onMouseDown` calls `e.preventDefault()`, with `userEvent.setup()` clicking the input, then the button — observed the input keeping focus, and the button taking focus once the handler no longer called `preventDefault()`; scratch deleted]

The focus move sits inside the branch that dispatches `mousedown`, so it is skipped for any element whose `mousedown` a handler prevents, not only a button.

## user-event 14.6.7 performs its own default action for `click`, `cut`, `keydown`, `keypress`, `keyup` and `paste` only when no listener called `preventDefault()` on the event

**Verified at:** @testing-library/user-event 14.6.7, read 2026-10-20
**Citation:** [instruction-pass_5: app/node_modules/@testing-library/user-event/dist/esm/event/dispatchEvent.js:1-6, 22-43 — the file imports the behaviors `click`, `cut`, `keydown`, `keypress`, `keyup` and `paste`, and `dispatchEvent` looks the event type up among them, dispatches the event, and runs the behavior only `if (!defaultPrevented)`]

A handler's `preventDefault()` on one of these events therefore shows in a test as user-event's default action missing.

## user-event 14.6.7 dispatches `keypress`, whose default action types the key into an editable target, only after a `keydown` no listener prevented

**Verified at:** @testing-library/user-event 14.6.7, read 2026-10-20
**Citation:** [instruction-pass_6: app/node_modules/@testing-library/user-event/dist/esm/system/keyboard.js:60-79 — `keypress` is dispatched only `if (unprevented && this.hasKeyPress(key))`, `unprevented` being the `keydown` dispatch's result; app/node_modules/@testing-library/user-event/dist/esm/event/behavior/keypress.js:26-29 — for an editable target the `keypress` behavior returns `input(instance, target, inputData, inputType)`]

A handler that prevents a `keydown` therefore leaves the typed character out of a field typed into with user-event.

## Testing Library's `getByLabelText` also matches any element whose `aria-label` attribute matches the text, whatever its tag or role

**Verified at:** @testing-library/dom 10.4.1, read 2026-10-20
**Citation:** [instruction-pass_7: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/queries/label-text.js:99-100, 128, 132 — the exported `getByLabelText` is `makeSingleQuery` over `getAllByLabelText`, which starts from `queryAllByLabelText`'s result; label-text.js:41-89 — `queryAllByLabelText` concatenates `queryAllByAttribute('aria-label', container, text, …)` to the `<label>`- and `aria-labelledby`-labelled matches, then filters only by `selector`, default `'*'`; `exact` defaults to `true`]

The match is exact by default (`exact = true`), so a test passes the `aria-label` text in full.

## `fireEvent.keyDown`, `fireEvent.keyPress` and `fireEvent.keyUp` dispatch cancelable `KeyboardEvent`s

**Verified at:** @testing-library/dom 10.4.1, read 2026-10-20
**Citation:** [instruction-pass_8: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/event-map.js:59-85 — `keyDown`, `keyPress` and `keyUp` each have `EventType: 'KeyboardEvent'` and `defaultInit` with `cancelable: true`]

The entry on `fireEvent`'s return value therefore applies to them: `fireEvent.keyDown` returns `false` when a handler called `preventDefault()`.

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
