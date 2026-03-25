# Spec: Post-exactOptionalPropertyTypes Cleanup

## Progress Tracker

- Sub-feature 1: mergeUpdate helper — Create a type-safe optimistic cache merge utility and its tests
- Sub-feature 2: DAL hook casts and return types — Replace `as T` casts with `mergeUpdate`; change `T | undefined` return types to `T | null`
- Sub-feature 3: Component fixes — Fix `undefined` domain values in `UploadImgBtn`, `ErrorBoundary`, and `ScreenNavBtn`
- Sub-feature 4: MentionNode null sentinel — Replace `string | undefined` with `string | null` across `MentionNode`, `MentionBadge`, and `MentionTypeaheadPlugin`
- Sub-feature 5: Call-site fixes for UploadImgBtn.image_id — Coerce `string | null | undefined` to `string | null` at every `UploadImgBtn` call site

## Sub-Feature Files

- [SF1 — mergeUpdate helper](SPEC_EXACT_OPTIONAL_CLEANUP_SF1.md)
- [SF2 — DAL hook casts and return types](SPEC_EXACT_OPTIONAL_CLEANUP_SF2.md)
- [SF3 — Component fixes](SPEC_EXACT_OPTIONAL_CLEANUP_SF3.md)
- [SF4 — MentionNode null sentinel](SPEC_EXACT_OPTIONAL_CLEANUP_SF4.md)
- [SF5 — Call-site fixes for UploadImgBtn.image_id](SPEC_EXACT_OPTIONAL_CLEANUP_SF5.md)

## Key Architectural Decisions

### `null` over `undefined` for domain absence

CLAUDE.md prohibits `undefined` as a domain value. `null` is the correct sentinel for "no value yet" in business logic. Every `T | undefined` return type or instance field that carries domain meaning is replaced with `T | null`. The `undefined` form is only acceptable for optional object properties where the key itself is absent (e.g. serialized JSON, React optional props that are structurally absent).

### mergeUpdate is an internal DAL utility

`mergeUpdate` is created inside `data-access-layer/` and used only by DAL hooks. It is not exported from `data-access-layer/index.ts`. The grouping barrel exports only public consumer-facing symbols. A utility that exists to service internal hook implementation details is not a public API.

### imgFilePath stripping belongs at the DAL layer

`UpdateAdventureData` and `UpdateNpcData` include an `imgFilePath` field that is consumed by the service layer but does not exist on the `Adventure` or `Npc` DB types. The `setQueryData` optimistic update must strip `imgFilePath` before merging — passing it into `mergeUpdate(old, patch)` where `old` is the DB type would produce a type error. The destructure-and-discard pattern (`const { imgFilePath: _imgFilePath, ...patch } = data`) strips the field at the DAL layer. The `_` prefix satisfies `noUnusedLocals`.

### UpdateSessionInput has no imgFilePath

`UpdateSessionInput` is imported directly from `@db/session` (not a service type). It contains only fields that exist on `Session`. `mergeUpdate(old, data)` is called directly with no stripping.

### `exactOptionalPropertyTypes` and optional prop shape

Under `exactOptionalPropertyTypes`, a prop typed `foo?: string` can only be left absent or assigned a `string` — passing `undefined` is a compile error. A prop typed `foo?: string | undefined` is equivalent to `foo?: string` structurally but makes the `undefined` slot explicit. The CLAUDE.md rule against `undefined` as domain values means the correct form for an optional prop whose value is a nullable domain entity is `foo?: string | null` — not `foo?: string | undefined`.

### SerializedMentionNode.adventureId key absence vs. null

In the serialized JSON representation, `adventureId` is either present as a `string` or absent entirely — we never write the key with an `undefined` value. The serialized type uses `adventureId?: string` (key may be absent). The in-memory `__adventureId` instance field is `string | null` — it is always initialized, to either a string or `null`. The `exportJSON` guard writes the key only when the value is non-null.

## CLAUDE.md Impact

None. This spec corrects existing code to comply with current conventions and introduces no new structural patterns, directory conventions, or module shapes. No existing CLAUDE.md example is invalidated.
