---
paths: ["app/src/**/*.tsx", "src/**/*.tsx", "app/src/**/use*.ts", "src/**/use*.ts", "app/src/hooks/**", "src/hooks/**", "app/src/providers/**", "src/providers/**", "app/src/data-access-layer/**", "src/data-access-layer/**", "app/src/routes/**", "src/routes/**"]
---

# React hooks and effects under `src/`

Hook-hygiene rules that fire for any file calling a React hook, regardless of where its data comes from, plus the error-surfacing rule for a promise chain started outside React's render cycle.

## Verify the provider tree before placing a hook call

**Before placing a hook call in any component — in artifact code or implementation — verify the component renders below every provider the hook depends on.** Reading the component file is not sufficient: trace its position in the provider tree, and re-trace after any extraction or move.

## `useLayoutEffect` over `useEffect`

**Use `useLayoutEffect` only when a DOM measurement or paint-synchronous side effect is required** — the canonical case is reading layout geometry (`getBoundingClientRect`, `scrollWidth`, `offsetHeight`) and applying a state update that must not cause a visible flash. All other effects use `useEffect`. When chosen, an inline comment stating the specific paint-synchronous requirement is required — "avoids flicker" alone is not sufficient.

- **Exception:** `eslint-plugin-react-hooks`'s `recommended` config bans `setState` at an effect's top level (`react-hooks/set-state-in-effect`) and reading `ref.current` during render (`react-hooks/refs`) — a `useLayoutEffect` reading a ref's geometry then calling `setState` synchronously trips both. Defer the `setState` into a subscription callback registered in the effect (e.g. a `ResizeObserver` observing the element) instead — never suppress either rule to keep the synchronous form. See `AnchoredPopup.tsx`'s viewport-clamping effect.

## `useCallback` and `useMemo` need a named consumer

**`useCallback` and `useMemo` are justified only when the wrapped value is read as a dependency in an effect's dependency array, or passed as a prop to a component wrapped in `React.memo`. Applying either hook by default — to event handlers, derived values, or callbacks with no such consumer — adds indirection with no referential-stability benefit and must not be done.** Before wrapping a function or computation in `useCallback`/`useMemo`, identify the specific consumer that requires referential stability. If none exists, write it as a plain `const` recomputed on every render. Name that consumer inline at the call site, in a comment — the qualifying reason must be stated there, not merely exist.

- ✅ GOOD: `useCallback` wrapping `onSelect` because it is passed to `<MemoizedListItem onSelect={onSelect} />`
- ✅ GOOD: `useMemo` wrapping a derived array because it is read inside a `useEffect` dependency array
- ❌ BAD: `useCallback`-wrapping a table-row mutation handler (`handleInsertRowAbove`) that is only ever called from an inline `onClick` in the same component's JSX — no memoized child and no effect dependency reads it

## State is reserved for values with no synchronous source

**State is reserved for values with no synchronous source (network/promise results, timers, subscriptions, DOM measurements) — a value fully computable at render time from props, other state, or module-level constants is derived via `useMemo`/a plain expression, never `useState` plus a recomputing setter.** Reaching for `useState` out of habit duplicates state render can compute directly, and desyncs when derivation logic and the setter drift apart.

- ✅ GOOD: `MentionTypeaheadPlugin.tsx` — `options` populated inside a `.then()` on `mentionSearchService.searchMentions(...)` (no synchronous source; a `queryGenerationRef` guard discards stale resolutions)
- ❌ BAD: `SlashCommandPlugin.tsx` — `options` synchronously filters the static `SLASH_COMMAND_OPTIONS` import in `onQueryChange`; no async boundary exists — should be `useMemo(() => SLASH_COMMAND_OPTIONS.filter(...), [matchingString])`
- **Exception:** Controlled inputs that drive auto-save mutations (`.claude/rules/src-components.md` — Controlled inputs that drive auto-save mutations) store a synchronous value (`widget?.name`) in `useState` anyway — justified by preventing mid-keystroke jank from re-fetch races, not by absence of a synchronous source. Not an instance of this principle; a documented carve-out.

## Never gate a continuous listener's state update

**Never gate a continuous listener's state update (ResizeObserver, scroll, MutationObserver, requestAnimationFrame) by equality-comparing two freshly-recomputed objects from the same live source** (e.g. `getBoundingClientRect()` results) — they're never reference-equal across invocations regardless of value match, so a settling check (`if (!isEqual(newRect, prevRect)) setSettledRect(newRect)`) never converges and the cycle loops forever. Fix: derive/store a primitive instead, so React's `Object.is` bail-out converges naturally — or if the real need is "has this happened once" rather than "has this stopped changing," use a one-shot ref/flag instead of a settling comparison.

- ✅ GOOD: `AnchoredPopup.tsx`'s `ResizeObserver` callback calls `setHorizontalOffset` with a primitive number from `calculateHorizontalClampOffset(...)` — bail-out stops the cycle once stable.
- ❌ BAD (illustrative): storing a `settledRect` object and equality-comparing it against fresh `getBoundingClientRect()` results — `getBoundingClientRect()` allocates a new object every call, so the comparison never converges.

## Event listener callback errors

**Every promise chain kicked off inside a Tauri event-listener callback (registered via `listen()`) must end in an explicit `.catch()` — wrapping the outer call in `void` to satisfy `no-floating-promises` is not sufficient alone.** This callback runs outside React's render cycle; a `.then()` chain with no `.catch()` becomes an unhandled promise rejection, not a caught error. Default handling is swallow-with-comment: state why the rejection is an expected, safe-to-ignore race (see `sendHello`/`pushNewChanges` in `useConnectivityLifecycle.ts`).

For a genuine unexpected failure rather than a known race, the surfacing mechanism depends on whether the listener-registering code is reachable from a live `ErrorBoundary`. When `listen()` is called from within a component, or a hook called (directly or transitively) by a component rendered under an `ErrorBoundary`, call `useErrorBoundary()` (from `react-error-boundary`) at the top level to obtain `showBoundary`, then invoke `showBoundary(error)` inside `.catch()`. Reserve `console.error` for the narrower case where no hosting component or hook exists in the call chain (e.g. module-level listener setup). Never leave the chain uncaught either way.

- ✅ GOOD: `const { showBoundary } = useErrorBoundary();` at the top of the hook, then `.catch((error: unknown) => showBoundary(error))` inside the effect
- ❌ BAD: calling `useErrorBoundary()` inside the `.catch()` callback itself — hooks cannot be called outside a component or hook's synchronous render/call path
- ❌ BAD: defaulting to `console.error` for a genuine failure when the calling hook is reachable from a live `ErrorBoundary` — the boundary path is available and must be used
