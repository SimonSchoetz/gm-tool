# Mention Badge Refactor

- Sub-feature 1: [Domain entity-type vocabulary](SPEC_MENTION_BADGE_REFACTOR_SF1.md) — canonical list of mentionable entity types, consumed by `buildEntityPath` and the new entity lookup
- Sub-feature 2: [Generic cross-table entity lookup](SPEC_MENTION_BADGE_REFACTOR_SF2.md) — DB + service function resolving a mention's live name by id, tolerant of deletion
- Sub-feature 3: [Live entity resolution hook](SPEC_MENTION_BADGE_REFACTOR_SF3.md) — DAL hook wrapping the lookup in TanStack Query
- Sub-feature 4: [MentionNode clipboard support](SPEC_MENTION_BADGE_REFACTOR_SF4.md) — `exportDOM`/`importDOM` for in-app and external paste
- Sub-feature 5: [MentionNode + MentionBadge format support](SPEC_MENTION_BADGE_REFACTOR_SF5.md) — custom format storage, toggle API, and badge rendering
- Sub-feature 6: [MentionFormatPlugin](SPEC_MENTION_BADGE_REFACTOR_SF6.md) — intercepts `FORMAT_TEXT_COMMAND` for mention selections
- Sub-feature 7: [Toolbar active-state extension](SPEC_MENTION_BADGE_REFACTOR_SF7.md) — `TextFormatBtn` reflects a selected mention's format
- Sub-feature 8: [Live badge rendering + deletion fallback](SPEC_MENTION_BADGE_REFACTOR_SF8.md) — `MentionBadge` consumes live data, renders the deleted state, opportunistically re-snapshots the node

## Key Architectural Decisions

### Clipboard support requires no base-class change

`exportDOM`, `static importDOM`, and `exportJSON` are declared on Lexical's base `LexicalNode` class, not gated behind `ElementNode` or `TextNode`. `MentionNode` stays a `DecoratorNode` — the interactive hover-popup/click-navigate behavior in `MentionBadge` (built on `usePinnedPopups`, `useNavigate`, and hover timers) is unaffected by this feature.

### Formatting is a custom, parallel mechanism — not Lexical's native format pipeline

`RangeSelection.formatText()` — the function `FORMAT_TEXT_COMMAND` dispatches to — only collects `TextNode` instances for a ranged selection, and only `ElementNode` instances for its no-text-selected fallback. A `DecoratorNode` is invisible to both paths. `MentionNode` therefore stores its own format state (`__mentionFormats: TextFormatType[]`) independent of Lexical's native `__format`, toggled by a dedicated command listener (SF6) rather than Lexical's built-in mechanism. This preserves the node's current atomic selection/deletion behavior, which a `TextNode`-based structure (e.g. `'token'` mode) would put at risk — `TextNode.isToken()`'s own documentation states token-mode nodes "can be navigated through character-by-character with a RangeSelection," a materially weaker guarantee than what `DecoratorNode` already provides.

### Live name/color resolution bypasses the existing per-entity DAL hooks entirely

The existing per-entity hooks (`useFoe`, `useNpc`, etc.) have `throwOnError: true`, and their service layer explicitly throws a domain "not found" error for a missing id (e.g. `foesService.getFoeById` throws `foeNotFoundError`). Calling these hooks from `MentionBadge` for a mention pointing at a deleted entity would crash the whole screen via the Error Boundary, not degrade one badge.

Instead, this feature adds a new generic, cross-table DB function (`db/mention-search.ts`'s `getById`, alongside its existing `searchByName`) that performs a parameterized `SELECT ... WHERE id = $1` and returns `null` when no row matches — a query result, not a thrown error. This mirrors `db/CLAUDE.md`'s documented "Cross-table utilities" exception (`mention-search.ts` already exists for exactly this kind of concern) and needs no per-entity-type dispatch, no new tolerant hook per entity type, and no changes to any of the six existing entity DAL modules.

### No cross-module cache invalidation wiring; freshness follows the existing per-mount convention

Every existing per-entity hook (`useFoe`, `useNpc`, `usePc`, `useFaction`, `useLocation`, `useItem`) already uses `staleTime: 0, refetchOnMount: 'always'` — the established convention for "always show the freshest value on mount" in this codebase, not real-time cross-component push. `useMentionEntityData` (SF3) follows the identical convention. A mention badge picks up a rename or a table-color change the next time its `TextEditor` mounts (e.g. navigating to the screen that hosts it) — matching the freshness guarantee every other entity view in the app already provides. No `invalidateQueries` wiring is added to the six existing entity DAL hooks.

### The node's stored `displayName`/`color` become a fallback snapshot, not the source of truth

`MentionNode` keeps its existing `displayName`/`color` fields (no schema removal — see below), but their role changes: they are no longer read as authoritative. The live badge (SF8) always prefers `useMentionEntityData`'s result over the stored snapshot when the entity still resolves, and falls back to the snapshot only while the query is loading or when the entity has been deleted (rendered as unlinked plain text — the deleted-entity AC). `MentionBadge` opportunistically re-snapshots the node (via `editor.update()`) whenever a live resolution differs from the stored value, so the deleted-entity fallback reflects the most recently seen name — not just the name at insertion time.

### No data migration is required

The only new field this feature adds to `SerializedMentionNode` (`mentionFormats`, SF5) is optional and defaults to an empty array in `importJSON` — the same pattern already used for the existing `adventureId` field (`json.adventureId ?? null`). Every other field is unchanged. `SerializedLexicalNode.version` is documented by Lexical itself as "not generally recommended for use" as a schema-migration mechanism, so it is not bumped. No existing persisted document needs to be rewritten.

### Unrecognized or unknown entity types are treated as deleted, not as an error

A mention's `entityType` is validated against the canonical list from SF1 before the DB lookup runs. This is a defense-in-depth check beyond `db/mention-search.ts`'s existing (unenforced, comment-documented) caller contract for `searchByName` — `MentionNode.__entityType` originates from potentially old, persisted document JSON rather than a value freshly read from `table_config`, so an explicit allow-list check is a justified strengthening for this call path specifically. An entity type absent from the canonical list resolves as `deleted: true` rather than throwing — from the GM's perspective, a stale or unrecognized target is indistinguishable from "this no longer exists."

### The deleted-entity visual state ignores the node's format field entirely

When `MentionBadge` renders the deleted-entity fallback, it applies only the `mention-badge--deleted` modifier (muted color, bold weight — user-confirmed visual, SF8) and applies no format modifier classes, regardless of what `mentionFormats` the node had before the entity was deleted. This is a deliberate scope boundary: the deleted state is a distinct signal ("this reference no longer resolves"), not a formatting variant, and mixing the two would make the deleted treatment visually inconsistent from mention to mention.

## CLAUDE.md Impact

No existing CLAUDE.md file documents Lexical node conventions for this codebase — `TextEditor/` has no `CLAUDE.md` of its own, and `app/src/CLAUDE.md` has no Lexical-specific section. This spec establishes, via direct inspection of the installed `lexical` package's type declarations, that a `DecoratorNode` (the base class `MentionNode` uses, and the only custom node type in this codebase as of this spec) has no access to Lexical's native text-format system: `RangeSelection.formatText()` — what `FORMAT_TEXT_COMMAND` dispatches to — only collects `TextNode` instances for a ranged selection and only `ElementNode` instances for its collapsed-selection fallback (`lexical/dist/Lexical.dev.mjs:9197-9211`, `lexical/dist/nodes/LexicalDecoratorNode.d.ts`). If `TextEditor/` gains a `CLAUDE.md` in the future, or `app/src/CLAUDE.md` gains a Lexical-node-conventions section, this fact — and the parallel custom-format-storage workaround SF5/SF6 establish as a result — belongs there, so a future custom `DecoratorNode` does not have to re-derive it from source.
