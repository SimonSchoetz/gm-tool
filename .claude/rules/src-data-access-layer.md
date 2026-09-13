---
paths: ["app/src/data-access-layer/**", "src/data-access-layer/**"]
---

# Data Access Layer

Conventions for files under `src/data-access-layer/`. What screens and components may assume of this layer — the consumer-side contract — is in `app/src/CLAUDE.md` — TanStack Query pattern. The general barrel and grouping-folder rules these build on are in `app/src/CLAUDE.md` — Barrel Files.

## Query keys are internal to the module

**Query key factories (`*Keys.ts`) are internal to the DAL module and never in the module barrel's public exports.** React components remain hook-only consumers: `data-access-layer/domainA/index.ts` exports `useNpc`/`useNpcs`, never `npcKeys`. A consumer structurally unable to call a hook (e.g. a route loader) may instead consume a `queryOptions`-built factory exported from the barrel — `queryOptions()` produces a typed options object that still encapsulates the key rather than exposing it raw.

- ✅ GOOD: `export const npcQueryOptions = (id: string) => queryOptions({ queryKey: npcKeys.detail(id), queryFn: () => service.getNpc(id) })` exported for a loader; illustrative, not tied to any specific file
- ❌ BAD: exporting `npcKeys` directly, or a hand-assembled `{ queryKey: npcKeys.detail(id), queryFn: ... }` object bypassing `queryOptions()` — the carve-out permits only a `queryOptions`-built factory, never the raw key or an ad hoc substitute

## Layer responsibilities

- `app/services/` — business logic, wraps DB calls and Tauri API calls needing business logic, composing multiple operations, or domain-typed error handling; throws domain errors from `@domain`. Import via `@services/<file>`. **Service-layer conventions (no fallback defaults for nullable columns, no replicating a DB `DEFAULT` at a call site) are documented in `app/services/CLAUDE.md`** — not duplicated here.
- `data-access-layer/` — wraps TanStack Query hooks, exposes clean API. Pure-read Tauri API calls with no business logic or domain error transformation go directly here — never through `services/`. One concern = one file: query keys, single-entity hooks, collection hooks, and a `queryOptions` factory module each own a separate file (`sessionKeys.ts`, `useSession.ts`, `useSessions.ts`, `sessionQueryOptions.ts`) — the shared cache deduplicates across hooks, so no `DomainProvider` wrapping mutations is needed.

## Non-negotiable rules

- Always add `throwOnError: true` to every `useQuery` call — without it, query errors are silently swallowed into the query's internal error state and never surface to the Error Boundary. Only permitted exception: a query explicitly designated as a non-blocking background check, where (a) `throwOnError` is intentionally omitted (never set to `false` explicitly) with a block comment explaining why the Error Boundary isn't the destination, and (b) the hook's return type exposes the error as a named typed field (e.g. `checkError: UpdateCheckError | null`) for local handling. A background check not exposing its error through the return type is not an exception — it's a violation.
- Never destructure `error` from `useQuery` and handle it locally — let it propagate.
- Never add a try/catch block to a data access hook or screen — including around `mutateAsync`, where `throwOnError: true` via QueryClient defaults already makes it unnecessary. If an error needs handling, it belongs in the service layer or the Error Boundary.
- **Mutations close over construction-time arguments — never accept them at call time — except when dispatch itself is deferred past construction.** When a `useMutation` hook requires an entity identifier known at construction and the mutation dispatches synchronously, inside the same event handler, capture it in the hook's closure — never declare it as a parameter of `mutationFn`. Carve-out: when dispatch is deferred past construction — scheduled via `setTimeout`, a debounce wrapper, or equivalent — on a hook whose component instance can be reused for a different entity before the callback fires (e.g. a route param change without remount), give `mutationFn` an `{ id, data }` parameter and pass the identifier through `mutate({ id, data })`, captured by that closure at schedule time, not read from `mutationFn`'s own closure — see this project's knowledge entry in `.claude/knowledge/tanstack-query.md`. Test: same synchronous call stack that read the identifier → closure-capture, id-as-parameter still always wrong; identifier read inside a callback scheduled to fire later → that callback must capture it and pass it through `mutate()`'s variables. Either shape keeps the hook's return type a named wrapper per the rule below — this carve-out touches only `mutationFn`'s parameter shape and the `mutate()` call, never the hook's return type.
  - ✅ GOOD (synchronous dispatch): `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: () => npcService.deleteNpc(npcId) })`
  - ❌ BAD (synchronous dispatch): `const useDeleteNpc = (npcId: string) => useMutation({ mutationFn: (id: string) => npcService.deleteNpc(id) })`
  - ✅ GOOD (deferred dispatch): `mutationFn: ({ id, data }: { id: string; data: UpdateStepInput }) => service.updateStep(id, data)`, dispatched via `mutate({ id: stepId, data: accumulated })` from inside a `setTimeout`-scheduled debounce closure that captured `stepId` at schedule time
  - ❌ BAD (deferred dispatch): `mutationFn: (data: UpdateStepInput) => service.updateStep(stepId, data)` reading `stepId` from the hook's own closure — a re-render that changes `stepId` after the `setTimeout` was scheduled but before it fires repoints the write at the new id, not the one being edited when the debounce started
- **A mutation that creates a new cache entry the user is about to navigate to (e.g. a `duplicate` operation) invalidates only the list query key — never a detail key for the new entity.** The new entity has no cached detail entry yet — the destination screen's own `useQuery` fetches it fresh on mount, so a detail-key invalidation here would be a no-op, not a fix for anything.
  - ✅ GOOD: a `duplicateMutation`'s `onSuccess` invalidates only `npcKeys.list(adventureId)` — `npcKeys.detail(newId)` was never fetched, so there is nothing to invalidate there
- **Hook return functions are typed to the caller's contract — never expose TanStack Query internals.** Every function on a DAL hook's return type must be declared as a named wrapper with a concrete signature reflecting exactly what the caller receives. Never re-export `mutateAsync`, `mutate`, or any other TanStack Query primitive directly. The return type must express the domain operation — not the framework's dispatch mechanism. Type compatibility between `mutateAsync` and `() => Promise<void>` is not a justification for removing the wrapper; the wrapper's purpose is to establish a boundary, not to resolve a type mismatch.
  - ✅ GOOD: `deleteNpc: () => Promise<void>` — caller sees a domain operation
  - ✅ GOOD: `updateNpc: (data: UpdateNpcData) => void` — caller sees the domain payload shape
  - ✅ GOOD: `createNpc: () => Promise<string>` — caller sees the domain return value
  - ❌ BAD: `deleteNpc: typeof deleteMutation.mutateAsync` — exposes a TanStack internal
