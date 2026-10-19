# Spec: Basic Stat Block content section

A GM can add a "Basic Stat Block" content section to a base entity: an HP number input with a text editor underneath, stored as one zod-validated JSON string in the section's existing `content` column. Branch: `feat/basic-stat-block`.

## Progress tracker

- Sub-feature 1: Domain content schemas — the `basic-stat-block` type, its content schema and parse functions, the type-keyed content-schema table, and the sync protocol bump
- Sub-feature 2: Database content validation — `update` validates a section's `content` against its own type's schema before writing
- Sub-feature 3: Cache-composed content writes — `useBaseEntityContentSections` gains `updateSectionContent`, which builds each content write from the cached section
- Sub-feature 4: Stat-block body in the panel — the content-section panel renders HP and the text editor for a basic stat block
- Sub-feature 5: Popup HP line and scaffold doc — the mention popup shows HP above the text, and `domain-scaffold.md` lists the content-section registration points

## Key Architectural Decisions

### A basic stat block's HP and text are one JSON envelope in the existing `content` column

The stored shape is `{ basicStatBlock: { hp: number | null }, textEditor: string }`, serialised with `JSON.stringify` into `base_entity_content_sections.content`, which is already a nullable `TEXT` column validated as `z.string().nullable()` [lead_3]. No migration is needed: `type` is `TEXT NOT NULL` with no SQL `CHECK` [lead_4], duplication copies `type` and `content` unchanged [lead_9], and sync carries the row through the table's existing triggers [lead_10]. A new basic stat block is created with `content` null, exactly like a text section; `parseBasicStatBlockContent` reads `null` as HP empty and text empty. That is how an absent value is read, not a default written into a row, so `app/db/CLAUDE.md` — Default Placement Hierarchy does not apply and `create.ts` stays unchanged.

### Only JSON whose shape this app defines is schema-validated; Lexical editor state stays an opaque string

`app/db/CLAUDE.md` — Conventions, "JSON string columns must have validated schemas" is read as covering JSON whose shape this app defines. A value structured by a third-party component and passed through opaquely is validated only as a string, including when it is nested inside an app-defined envelope — the same reasoning as that file's Default Placement Hierarchy exception, "the schema doesn't own content structured by an external component". So the envelope is schema-validated, `textEditor` is `z.string()`, and `text` and `5e-stat-block` content stays unvalidated. `textEditor` holds exactly the string `TextEditor` emits (Lexical JSON or `''` [architect_4]) rather than a nested object, because `ExternalValueSyncPlugin` compares its `value` with the editor's own `JSON.stringify` output byte for byte [architect_15].

### One content-schema table in `domain/`, keyed by section type, behind one accessor

`app/domain/base-entity-content-sections/contentSectionContentSchemas.ts` holds a module-private `Record<BaseEntityContentSectionType, z.ZodType | null>` and exports only `assertValidContentSectionContent`. The `Record` makes `tsc` demand an entry for every future type, so each template states its schema or states `null`. Placement follows `app/domain/CLAUDE.md` — What Belongs Here (lookup tables keyed by a domain type, accessor exported, table module-private); the table's values are schemas, not column defaults, so that clause's exception does not apply.

### `update` validates `content` against the section's own type

`app/db/base-entity-content-section/update.ts` receives only an id and a patch [lead_6]. When the patch carries `content` as a string, it takes the type from the patch's own `type` when present, otherwise from the stored row with one `SELECT`; no row means nothing to validate, and the `UPDATE` matches nothing, as it does today. The type comes from the row itself, so no caller can pair content with the wrong type. The extra read happens only on a debounced content save and needs no atomicity, because nothing in the app changes a section's `type` after creation. `create` writes no `content` [architect_6], so it has nothing to validate.

### Stored content that fails its schema throws without an error factory

`app/CLAUDE.md` — TypeScript Coding Style, "This rule governs domain errors" exempts a should-never-happen invariant. Every write is validated, so stored stat-block content that fails its schema on read is such an invariant: `parseBasicStatBlockContent` and `assertValidContentSectionContent` let the `SyntaxError` or `ZodError` propagate, as `parseLayoutFromRow` throws on an invalid stored layout [architect_7]. On read it reaches the Error Boundary through the query's `throwOnError`; the Error Boundary does not branch on error names [architect_8].

### HP's whole-number rule has one source, and the UI gates HP before writing

A module-private `hpSchema = z.int().nullable()` in `basicStatBlockContent.ts` is both the envelope's `hp` field and what `parseBasicStatBlockHpInput` checks typed text against. `z.int()` accepts only safe integers, negatives included [spec-writer_2], and `z.number()`-based schemas reject `NaN` and `±Infinity` [spec-writer_1], so `Number(raw)` needs no separate check. The UI gates before writing because mutations default to `throwOnError: true` [architect_14]: a db rejection of `1.5` would replace the screen with the error fallback instead of leaving the value unsaved. The db check in `update` stays as the backstop.

### HP and text writes compose against the query cache, never against rendered content

HP and text both rewrite the whole `content` string, and the autosave queue merges a section's pending patch field by field (`mergeUpdate`) [lead_7], so the later `content` wins whole. A component learns of a `setQueryData` write only after a `setTimeout(0)`, while `getQueryData` returns it at once [architect_10, architect_11, architect_13; `.claude/knowledge/tanstack-query.md` — "A `setQueryData` write is readable through `getQueryData` at once…"]. Clicking into the editor emits a full-content `onChange`, because `OnChangePlugin`'s `ignoreSelectionChange` defaults to `false` [architect_12; `.claude/knowledge/lexical.md`]. A write built from rendered content could therefore put an old HP back over a new one. `updateSectionContent(sectionId, compose)` reads the section from the cache at call time, applies `compose` to its `content`, and hands the result to the existing `updateSection`, which writes the cache and schedules the save.

### The stat-block body reads its own section and saves its own edits

`.claude/rules/src-components.md` — Framework context is not a prop forbids relaying a data-fetching result or callback as a prop when the child can obtain it itself. `BasicStatBlockSectionBody` therefore takes only `sectionId` — the panel owns which section is selected — and calls `useParams` and `useBaseEntityContentSections` itself. The body thus holds its own hook instance and its own autosave queue. HP and text saves go through the body's queue and the section name through the panel's. Both queues key the same section id but carry disjoint fields (`content` vs `name`), and each sends its own `UPDATE`. A second instance of this hook already exists in the mention popup (`BaseEntityPopupContent.tsx:31-32`), and both share one query key. Stated consequence: a content save still pending when the GM switches sections is flushed when the body unmounts, and if that write fails it reaches no Error Boundary — the path the project already accepts for every unmount flush [architect_30]. Only a db-level failure can take it, since HP is gated in the domain and `textEditor` is any string.

### The HP field is a plain number `Input` with `useSyncedInputValue`, not `SyncedInput`

This departs from `.claude/rules/src-components.md` — Controlled inputs that drive auto-save mutations: "Case 1 — the element is (or wraps) `Input`: use `SyncedInput` (`src/components/SyncedInput/SyncedInput.tsx`)". `SyncedInput` omits `onFocus` and `onBlur` from its props and keeps its display value in its own `useSyncedInputValue` state, and it hands `onCommit` only the value string [spec-writer_10]. HP needs two things it cannot provide:

- The input's `validity.badInput`, to tell a cleared field from unconvertible text (next decision).
- A blur handler that reverts a value that cannot be saved to the last saved HP.

The field is wired as that rule's Case 2 describes, but on an `Input`: `useSyncedInputValue`'s `value`, `setValue` and `focusProps`, with `setValue` and the save both called from the change handler. The departure is recorded under CLAUDE.md impact.

### Unconvertible number-input text is never read as a cleared HP

While an `<input type='number'>` holds text that is not a valid floating-point number — `1.` on the way to `1.5`, a lone `-` before a negative — its `value` is `''` and `validity.badInput` is `true` [spec-writer_3, spec-writer_4; `ValidityState.badInput` is typed in lib.dom, spec-writer_6]. Reading that `''` as "HP cleared" would save an empty HP on the way to `1.5`, and the final `1.5` is then rejected, leaving HP empty after a restart instead of the last whole number. `readSaveableHp` in the body's `helper/` returns `{ valid: false }` whenever `badInput` is true and otherwise delegates to `parseBasicStatBlockHpInput`; both the change handler and the blur handler use it.

### A revert remounts the HP input

On blur with an unsaveable value, the body sets the local value back to the saved HP and increments a revision number that keys the `Input`. react-dom 19.3.0 rewrites a controlled number input's DOM `value` only when it differs loosely from the bound value [spec-writer_5]. Text it cannot convert already reads `''`, so reverting to an empty HP would otherwise leave `-` or `1.` on screen. Remounting gives a fresh element showing the saved HP. The blur has already moved focus elsewhere, so the remount takes no focus from the GM.

### HP writer and text writer: dispositions

HP and text are two writers of one field, so every disposition is stated for both.

| Handler | Triggering event | State read | State mutated | No-op when |
| --- | --- | --- | --- | --- |
| HP change | input event on the HP field | the input's `value` and `validity.badInput`; the cached section, through `updateSectionContent` | local HP text; cached `content` (HP replaced) and the body's pending save | `readSaveableHp` says invalid: the local text still updates, nothing is saved |
| HP blur | the HP field loses focus | the input's `value` and `validity.badInput`; the rendered saved HP | focus flag; local HP text; HP input revision | `readSaveableHp` says valid: only the focus flag changes |
| Text change | `TextEditor`'s `onChange`, content or selection change | the cached section, through `updateSectionContent` | cached `content` (`textEditor` replaced) and the body's pending save | never: every value is a valid string |
| External content change | the cached section's `content` changes (a paired device's sync, the body's own writes) | the rendered section | HP: local text adopted by `useSyncedInputValue` only while the field is unfocused; text: editor rewritten by `ExternalValueSyncPlugin` only while unfocused [architect_15] | the field or editor is focused, or the value is unchanged |

- **Reset on section switch:** the body is keyed by section id, and its editor's `textEditorId` contains the section id.
- **Flush on unmount:** both writers share the body's queue.
- **Readers:** the panel body and the popup both parse with `parseBasicStatBlockContent`, and both throw on stored content that fails the schema.

### Discriminant comparisons stay inline

The panel and the popup each compare `section.type === 'basic-stat-block'`. `tsc` checks the literal against `BaseEntityContentSectionType`, so this is type narrowing, not a raw literal under the shared rule beginning "Before considering any change set complete, grep for other occurrences of any raw literal". It is not extracted into a predicate: extraction would add a function and its test without catching any further mistake.

### Sync protocol version 2

`SYNC_PROTOCOL_VERSION` in `app/domain/sync/messages.ts` goes from `1` to `2`. Two paired devices sync only when their protocol version and `migrationHead` are equal [architect_18], and this feature changes neither by itself. An older build checks a peer row against its own schema, whose `type` enum lacks `basic-stat-block`, and skips it [architect_19], while its watermark still advances past it [architect_20], so the row would be lost to that device until edited again. With the bump, mixed builds pause sync until both are upgraded.

### Shared values and their single homes

- **The "HP" label:** `BASIC_STAT_BLOCK_HP_LABEL` in `basicStatBlockContent.ts`, read by the panel body and the popup. Display labels for content-section types already live in this module (`contentSectionTypeLabels.ts`).
- **The editor placeholder:** `CONTENT_SECTION_EDITOR_PLACEHOLDER` in `BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.constants.ts`, shared by the panel's text branch and the body, per `app/src/CLAUDE.md` — Constants, Trigger 1.
- **Intended separate copies:**
  - `params.baseEntityId ?? ''` after `useParams({ strict: false })` is the routing idiom five components already repeat (`BaseEntityContentSectionPanel.tsx:27`, `BaseEntityCrumb.tsx:10` among them). Framework context is not a prop requires each component to read routing context itself.
  - `schema.parse` of a `JSON.parse` result appears in both `parseBasicStatBlockContent` (returns typed content for display) and `assertValidContentSectionContent` (asserts any type's write). They serve different concerns, so the shared rule beginning "Separation of concerns wins over DRY" keeps them apart; the domain fact they check has one home, `basicStatBlockContentSchema`.
  - `.find((section) => section.id === sectionId) ?? null` appears in `updateSectionContent` and in the body. The first reads the cache at call time and the second the rendered list, so the two have different sources at different moments, and a shared helper would only wrap `Array.prototype.find`.
  - The panel's and the popup's HP label colour each use `var(--color-fg-muted)` in their own stylesheet, because class names are namespaced per component (`.claude/rules/src-css.md` — Class naming).
- **The stat-block editor's `textEditorId`:** `basic-stat-block-${sectionId}`, deliberately distinct from the text branch's `content-section-${id}`. It names a different editor and is not a second copy of that id.

## Sub-feature 1: Domain content schemas

Adds the `basic-stat-block` type, its content schema with parse, patch and HP-input functions, the type-keyed content-schema table with its accessor, and the sync protocol bump.

### Files affected

- `Modified:`
  - `app/domain/base-entity-content-sections/contentSectionTypes.ts` — the array becomes `['text', 'basic-stat-block', '5e-stat-block']`; its order drives the type menu [lead_5].
  - `app/domain/base-entity-content-sections/contentSectionTypeLabels.ts` — `'basic-stat-block': 'Basic Stat Block'` between the `text` and `'5e-stat-block'` entries.
  - `app/domain/base-entity-content-sections/index.ts` — explicit named exports for `assertValidContentSectionContent`, `parseBasicStatBlockContent`, `patchBasicStatBlockContent` and `parseBasicStatBlockHpInput`.
  - `app/domain/sync/messages.ts` — `SYNC_PROTOCOL_VERSION = 2`.
- `Deleted:` none.
- `New:`
  - `app/domain/base-entity-content-sections/basicStatBlockContent.ts`
  - `app/domain/base-entity-content-sections/contentSectionContentSchemas.ts`
  - `app/domain/base-entity-content-sections/__tests__/basicStatBlockContent.test.ts`
  - `app/domain/base-entity-content-sections/__tests__/contentSectionContentSchemas.test.ts`
- `Moved:` none.
- `Draft:` none.

No change needed:

- `app/domain/index.ts` re-exports this subdomain with `export * from './base-entity-content-sections'`, the form `app/domain/CLAUDE.md` — Structure sanctions for a subdomain's curated barrel, so the new names reach `@domain`.
- `app/domain/base-entity-content-sections/__tests__/contentSectionTypeLabels.test.ts` asserts only `text` and `5e-stat-block` labels and the name fallback, none of which change.
- `app/domain/sync/__tests__/messages.test.ts` passes a literal `syncProtocolVersion: 1` only to `syncMessageSchema`, whose field is `z.number()`, so no assertion goes stale.

### Domain

`basicStatBlockContent.ts`:

- `hpSchema` — module-private, `z.int().nullable()` (`import { z } from 'zod'`, as `domain/sync/messages.ts` does).
- `basicStatBlockContentSchema` — `z.object({ basicStatBlock: z.object({ hp: hpSchema }), textEditor: z.string() })`. Exported from the file for `contentSectionContentSchemas.ts`, never from the barrel.
- `BasicStatBlockContent` — module-private type, `z.infer<typeof basicStatBlockContentSchema>`. It is not exported: callers use the inferred return type, and `local/no-unused-exports` reports an export no file imports [spec-writer_11]. `type SyncMessage` in `domain/sync/messages.ts:65` is the same module-private-type-in-an-exported-signature shape.
- `BasicStatBlockHpInput` — module-private type, `{ valid: true; hp: number | null } | { valid: false }`.
- `parseBasicStatBlockContent(content: string | null): BasicStatBlockContent`:
  - `null` returns `{ basicStatBlock: { hp: null }, textEditor: '' }`.
  - Otherwise it assigns `JSON.parse(content)` to a `const` annotated `unknown` (as `db/table-config/parse-layout-row.ts:5` does) and returns `basicStatBlockContentSchema.parse` of it. Malformed JSON or a wrong shape throws (Key Architectural Decisions — Stored content that fails its schema throws without an error factory).
- `patchBasicStatBlockContent(content: string | null, patch: { hp: number | null } | { textEditor: string }): string` — parses `content` with `parseBasicStatBlockContent`, replaces only the field the patch names (narrowed with `'hp' in patch`), and returns the `JSON.stringify` result.
- `parseBasicStatBlockHpInput(raw: string): BasicStatBlockHpInput`:
  - Text that is empty after `trim()` returns `{ valid: true, hp: null }`.
  - Otherwise it runs `hpSchema.safeParse(Number(raw))`: success returns `{ valid: true, hp: <parsed data> }`, failure `{ valid: false }`.

`contentSectionContentSchemas.ts`:

- `CONTENT_SECTION_CONTENT_SCHEMAS` — module-private, typed `Record<BaseEntityContentSectionType, z.ZodType | null>`: `text: null`, `'basic-stat-block': basicStatBlockContentSchema`, `'5e-stat-block': null`. A `ZodObject` is assignable to `z.ZodType` [spec-writer_9].
- `assertValidContentSectionContent(type: BaseEntityContentSectionType, content: string): void` — returns when the type's entry is `null`. Otherwise it assigns `JSON.parse(content)` to an `unknown` const and runs the entry's `parse` on it, which throws on failure. `content` is `string`, not `string | null`: the only caller validates only string content, since a `null` content is how an absent value reads (Key Architectural Decisions — A basic stat block's HP and text are one JSON envelope).

`index.ts` keeps its explicit named-export style (`app/domain/CLAUDE.md` — Structure; `app/CLAUDE.md` — Directory Structure): `export { assertValidContentSectionContent } from './contentSectionContentSchemas';` and `export { parseBasicStatBlockContent, patchBasicStatBlockContent, parseBasicStatBlockHpInput } from './basicStatBlockContent';`.

`messages.ts`: `SYNC_PROTOCOL_VERSION` becomes `2`, with a one-line comment directly above it: "Peers sync only when this matches; bump it when a build starts writing synced values an older build's schemas reject, so mismatched builds pause sync instead of skipping rows."

Consumers in later sub-features, each through `@domain`:

- `assertValidContentSectionContent` — Sub-feature 2, `app/db/base-entity-content-section/update.ts`.
- `parseBasicStatBlockContent` — Sub-feature 4, `BasicStatBlockSectionBody.tsx`, and Sub-feature 5, `BaseEntityPopupContent.tsx`.
- `patchBasicStatBlockContent` — Sub-feature 4, `BasicStatBlockSectionBody.tsx`.
- `parseBasicStatBlockHpInput` — Sub-feature 4, `helper/readSaveableHp.ts`.

This sub-feature's tests import all four from their own files, so `local/no-unused-exports` should not report them before their later consumers exist. That is reasoned from the rule's logic [spec-writer_11], not run.

### Tests

`__tests__/basicStatBlockContent.test.ts` (pure functions, no database):

- `parseBasicStatBlockContent(null)` returns HP empty and text empty — catches throwing on a new section's `null` content.
- Valid stored JSON parses to its HP and text — catches returning the empty value for non-null content.
- Malformed JSON throws, and a well-formed envelope with a decimal HP throws — catches accepting stored content the schema rejects.
- An HP patch keeps the existing text, and a text patch keeps the existing HP — catches a patch that replaces the whole envelope.
- A patch applied to `null` content yields a parseable envelope holding the patched field — catches a patch that fails on a new section.
- HP input: `''` and whitespace-only text give `hp: null` as valid — catches a field that cannot be cleared.
- HP input: a negative whole number is valid — catches a rule that rejects negatives.
- HP input: a decimal and non-numeric text are invalid — catches a rule that saves non-whole values.

`__tests__/contentSectionContentSchemas.test.ts` (pure, no database):

- A `null`-entry type (`text`) accepts non-JSON content — catches validating types that have no schema.
- `basic-stat-block` accepts a valid envelope and throws on an invalid one and on malformed JSON — catches an accessor that skips the schema for a type that has one.

## Sub-feature 2: Database content validation

`update` validates a string `content` against the section's own type's schema before writing.

### Files affected

- `Modified:`
  - `app/db/base-entity-content-section/update.ts` — type resolution and the `assertValidContentSectionContent` call.
  - `app/db/base-entity-content-section/__tests__/update.test.ts` — new behaviours below. Its `createSection` helper gains a `type: BaseEntityContentSectionType` parameter (`import type` from `@domain`), and its existing calls pass `'text'`. The two existing tests stay valid: `type: 'bogus'` is still rejected by `updateSchema`, and the content `'c'` goes to a `text` section, which has no schema.
- `Deleted:` none.
- `New:` none.
- `Moved:` none.
- `Draft:` none.

No change needed:

- `create.ts` writes no `content` [architect_6].
- `duplicate-by-base-entity.ts` copies `content` verbatim [lead_9].
- `app/services/baseEntityContentSectionService.ts`: `updateSection` forwards to `update`, and its catch already wraps any thrown error in `baseEntityContentSectionUpdateError` (`baseEntityContentSectionService.ts:46-55`). `bulkReorderSections` sends only `sort_order`, so it never reaches the validation.

### Database

In `update.ts`, after `const db = await getDatabase()` and before `buildUpdateQuery`, when `typeof validated.content === 'string'`:

1. Resolve the type. Take `validated.type` when the patch carries one. Otherwise read the stored row's type with `db.select<Pick<BaseEntityContentSection, 'type'>[]>('SELECT type FROM base_entity_content_sections WHERE id = $1', [id])` (`import type { BaseEntityContentSection } from './types'`), taking the first row's `type` with `.at(0)?.type ?? null`; `local/no-unnormalized-lookup-result` requires the `?? null`.
2. With a type, call `assertValidContentSectionContent(type, validated.content)` (from `@domain`), which throws before anything is written.
3. With no type (no row), write as today.

The validation runs on `validated` — the `updateSchema.parse` result — so a patch's `type` has already been checked against the enum.

### Tests

`__tests__/update.test.ts` keeps its wiring (`// @vitest-environment node`, the top-level `plugin-sql` mock, `vi.resetModules()` in `beforeEach`, dynamic imports), per `.claude/rules/db-unit-tests.md`.

- Valid stat-block content on a `basic-stat-block` row is written — catches rejecting valid content.
- Stat-block content with a decimal HP on a `basic-stat-block` row is rejected, and the row reads back unchanged — catches writing unvalidated content, or validating after the write.
- Non-JSON content on a `text` row is written — catches validating every type against the stat-block schema.
- On a `text` row, a patch carrying both `type: 'basic-stat-block'` and invalid stat-block content is rejected, and the row reads back unchanged — catches validating against the stored type when the patch carries its own.
- A content update for a well-formed id that matches no row resolves — catches throwing when the type lookup finds no row.

## Sub-feature 3: Cache-composed content writes

`useBaseEntityContentSections` gains `updateSectionContent`, which composes a content write against the cached section.

### Files affected

- `Modified:`
  - `app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts` — `updateSectionContent` on the return type and the returned object.
  - `app/src/data-access-layer/base-entity-content-sections/__tests__/useBaseEntityContentSections.test.ts` — new behaviours below; its four existing tests are unaffected.
- `Deleted:` none.
- `New:` none.
- `Moved:` none.
- `Draft:` none.

No change needed: `app/src/data-access-layer/base-entity-content-sections/index.ts` and the grouping barrel `app/src/data-access-layer/index.ts` (line 14) both export the hook by name, and the new member travels on the hook's return value.

### Data Access Layer

`UseBaseEntityContentSectionsReturn` gains `updateSectionContent: (sectionId: string, compose: (current: string | null) => string) => void`, a named wrapper per `.claude/rules/src-data-access-layer.md` — "Hook return functions are typed to the caller's contract". `updateSection` is unchanged.

At call time, `updateSectionContent`:

1. Reads the list with `queryClient.getQueryData<BaseEntityContentSection[]>(baseEntityContentSectionKeys.list(baseEntityId))`, finds `sectionId` with `.find(...) ?? null`, and returns with a bare `return;` when it is absent.
2. Otherwise calls `updateSection(sectionId, { content: compose(section.content) })`. That reuses `updateSection`'s cache write and `saveQueue.schedule`, per root `CLAUDE.md` — DRY per layer.

`baseEntityId` is read in the caller's synchronous event handler, so no deferred-dispatch carve-out applies.

One comment directly above `updateSectionContent` states why it reads the cache: "Reads the cache, not `sections`: a component re-renders with a `setQueryData` write only a task later, so composing from rendered content could write an older value back over a newer one."

Consumer: Sub-feature 4, `BasicStatBlockSectionBody.tsx`.

### Tests

Per `.claude/rules/src-data-access-layer.md` — "A hook with a deferred save", with the file's existing `renderHookWithQueryClient`, `settle` and fake-timer wiring:

- Two `updateSectionContent` calls on one section inside one `act`, with no re-render between them, produce one save whose content the second `compose` built from the first's result — catches composing from the rendered `sections`, which drops the first write.
- A call for an id absent from the cached list makes no save — catches saving `compose(null)` for a section that is not there.

## Sub-feature 4: Stat-block body in the panel

The content-section panel renders HP and the text editor for a basic stat block. Every other type keeps today's `TextEditor`.

### Files affected

- `Modified:`
  - `app/domain/base-entity-content-sections/basicStatBlockContent.ts` — `export const BASIC_STAT_BLOCK_HP_LABEL = 'HP';`.
  - `app/domain/base-entity-content-sections/index.ts` — `BASIC_STAT_BLOCK_HP_LABEL` added to the explicit export list from `./basicStatBlockContent`.
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.tsx` — the type branch, and the placeholder read from the constants file.
- `Deleted:` none.
- `New:`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.constants.ts`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.tsx`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.css`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/index.ts`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/helper/readSaveableHp.ts`
  - `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/helper/__tests__/readSaveableHp.test.ts`
- `Moved:` none.
- `Draft:` none.

### Domain

`BASIC_STAT_BLOCK_HP_LABEL` is the HP label's one home (Key Architectural Decisions — Shared values and their single homes). It is added here, alongside its first consumer, so no earlier sub-feature exports an unused name. Consumers: `BasicStatBlockSectionBody.tsx` here, and `BaseEntityPopupContent.tsx` in Sub-feature 5.

### Frontend

**`BaseEntityContentSectionPanel.constants.ts`** — `export const CONTENT_SECTION_EDITOR_PLACEHOLDER = 'Start typing or use / for commands';`, the literal the panel passes today. Consumers: the panel's text branch and the body.

**`BaseEntityContentSectionPanel.tsx`**

- **Purpose:** dispatch the selected section's body by type.
- **Behavior:**
  - Inside the existing `.base-entity-content-section-panel-content` div, `selected.type === 'basic-stat-block'` renders `<BasicStatBlockSectionBody key={selected.id} sectionId={selected.id} />`, imported from `./components/BasicStatBlockSectionBody`.
  - A comment above it states: "Keyed by section id, so switching between two stat-block sections remounts the body and resets its HP field."
  - Every other type renders the existing `TextEditor`, unchanged except that its `placeholder` reads `CONTENT_SECTION_EDITOR_PLACEHOLDER`. Its comment stays.
  - The panel does not destructure `updateSectionContent` (Key Architectural Decisions — The stat-block body reads its own section and saves its own edits).
- **UI / Visual:** the body sits where the text editor sits, inside the same scroll area, so the HP row scrolls with the text.

**`BasicStatBlockSectionBody/`** — a module directory with `index.ts` (`export { BasicStatBlockSectionBody } from './BasicStatBlockSectionBody';`), because it holds `helper/` besides its main file and stylesheet (`app/src/CLAUDE.md` — Barrel Files).

**`BasicStatBlockSectionBody.tsx`** — `type Props = { sectionId: string }`, typed `FCProps<Props>`.

- **Purpose:** show and edit one basic stat block's HP and text.
- **Behavior:**
  - **Data:**
    - `baseEntityId` is `params.baseEntityId ?? ''` from `useParams({ strict: false })`, the routing idiom the panel repeats on purpose (Key Architectural Decisions — Shared values and their single homes). The body calls `useBaseEntityContentSections(baseEntityId)` for `sections` and `updateSectionContent`. It renders below the panel, which calls both, so every provider they need is above it (`.claude/rules/src-react-hooks.md` — Verify the provider tree).
    - The section is `sections.find((s) => s.id === sectionId) ?? null`.
    - It parses with `parseBasicStatBlockContent(section?.content ?? null)`.
    - `savedHpText` is `''` when HP is `null`, otherwise `String(hp)`.
  - **Hook placement:** `useSyncedInputValue(savedHpText)` and `useState(0)` for `hpInputRevision` come after that parse, because `useSyncedInputValue` reads `savedHpText` synchronously. All hooks come before the `if (section === null) return;` that renders nothing for a missing section.
  - **HP change handler:**
    1. Calls `setValue(event.currentTarget.value)`.
    2. Calls `readSaveableHp(event.currentTarget)`.
    3. When the result is valid, calls `updateSectionContent(sectionId, (current) => patchBasicStatBlockContent(current, { hp }))`.
  - **HP blur handler:** calls `focusProps.onBlur()`. When `readSaveableHp(event.currentTarget)` is invalid, it calls `setValue(savedHpText)` and increments `hpInputRevision`. `onFocus` is `focusProps.onFocus`, passed directly.
  - **Text editor:**
    - `textEditorId` is `` `basic-stat-block-${sectionId}` ``, `value` is the parsed `textEditor`, and `placeholder` is `CONTENT_SECTION_EDITOR_PLACEHOLDER`.
    - `onChange` calls `updateSectionContent(sectionId, (current) => patchBasicStatBlockContent(current, { textEditor: value }))`.
  - **Edge states:**
    - A new section shows HP empty and the editor placeholder.
    - There is no loading state, because the panel has already loaded the list.
    - Stored content that fails the schema throws to the Error Boundary.
- **UI / Visual:**
  - The root is a `div.basic-stat-block-section-body`: a flex column filling the panel content's width (`flex: 1`), with `--spacing-sm` between the HP row and the editor.
  - The HP row is a `label.basic-stat-block-section-body-hp`: a flex row with centred items and `--spacing-sm` between its children. It is flush with the panel content's left edge.
  - The row holds a `span.basic-stat-block-section-body-hp-label` showing `BASIC_STAT_BLOCK_HP_LABEL` in `--color-fg-muted`, then `<Input key={hpInputRevision} type='number' …>`. `Input` is used per the `UI primitive wrappers` name-match rule, since no `NumberInput` exists. The input fills the rest of the row through its own `width: 100%`.
  - This field is not `SyncedInput`, a deliberate departure from Controlled inputs that drive auto-save mutations, Case 1 (Key Architectural Decisions — The HP field is a plain number `Input` with `useSyncedInputValue`, not `SyncedInput`).
  - The input has no placeholder and no CSS touching its native stepping controls.
  - The `label` wrapping makes the input its labeled control, so a click on "HP" focuses it [spec-writer_8].
  - `TextEditor` is below the row.
- **Comments** (rationale and failure mode, each at one location):
  1. Directly above the `useBaseEntityContentSections` call: "HP and text both rewrite the whole `content`, so every write composes against the cached section through `updateSectionContent`, never against the rendered `section`, which lags a cache write by a task — an HP edit would otherwise be overwritten by the editor's next save."
  2. Directly above the change handler's `readSaveableHp` call, covering the blur handler's call too: "Saves and reverts go through `readSaveableHp`, never `parseBasicStatBlockHpInput(value)` alone: a number input holding text it cannot convert (`1.` while typing `1.5`, a lone `-`) reports `value` as `''`, and reading that as a cleared field would save an empty HP."
  3. On the line above the `Input`'s `key`: "Remounted on every revert: React rewrites a number input's text only when its DOM value differs from the bound value, and unconvertible text already reads `''`, so a revert to an empty HP would otherwise leave `-` or `1.` on screen."

[MANUAL-VERIFY] Hand-off item for the human tester, in `pnpm run dev` (root `CLAUDE.md`: only the Tauri app reaches the database, and an agent session cannot drive it): with HP saved as `1`, type `.5` after it so the field reads `1.5`, restart the app — HP shows `1`.

[MANUAL-VERIFY] Same hand-off: in an empty HP field type `-5`, restart — HP shows `-5`.

[MANUAL-VERIFY] Same hand-off: select HP's whole text and delete it, restart — HP is empty.

[MANUAL-VERIFY] Same hand-off: with HP saved as `3`, type until the field reads `3.5`, then click into the text editor — the field shows `3`. With HP saved empty, type `-` and click into the editor — the field shows nothing.

[MANUAL-VERIFY] Same hand-off: focus HP and press ArrowUp, then ArrowDown — the value steps by 1 each time, and the last value is there after a restart.

Hand-off check for the human tester, in `pnpm run dev` (Acceptance Criteria 4; the composition itself is pinned by Sub-feature 3's test): change HP and click straight into the editor and type; then type in the editor and change HP straight away; restart — both edits are kept.

**`BasicStatBlockSectionBody.css`** — the three classes above, every value a token (`--spacing-sm`, `--color-fg-muted`), per `.claude/rules/src-css.md`.

**`helper/readSaveableHp.ts`**

- **Signature:** `readSaveableHp(input: { value: string; validity: Pick<ValidityState, 'badInput'> }): ReturnType<typeof parseBasicStatBlockHpInput>`. An `HTMLInputElement` (`event.currentTarget`) satisfies the parameter [spec-writer_9].
- **Behavior:** returns `{ valid: false }` when `input.validity.badInput` is true; otherwise returns `parseBasicStatBlockHpInput(input.value)` (from `@domain`).

### Tests

`helper/__tests__/readSaveableHp.test.ts`, required by `.claude/rules/src-unit-tests.md` — Testing Policy (helper functions). Fixtures are plain `{ value, validity: { badInput } }` objects.

- `badInput: true` with `value: ''` is invalid — catches reading unconvertible text as a cleared HP.
- `badInput: false` with `value: ''` is valid with `hp: null` — catches blocking a deliberate clear.
- `badInput: false` with `value: '1.5'` is invalid — catches skipping the whole-number check whenever `badInput` is false.

`BasicStatBlockSectionBody.tsx` and the panel get no tests (`app/src/CLAUDE.md` — Testing Policy, Forbidden); the browser-native risks are the `[MANUAL-VERIFY]` items above.

## Sub-feature 5: Popup HP line and scaffold doc

In the mention popup, a basic stat block shows its HP above its read-only text. `domain-scaffold.md` gains the content-section registration points.

### Files affected

- `Modified:`
  - `app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx` — `summaryHeader?: ReactNode`.
  - `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx` — the stat-block branch and the stylesheet import.
  - `app/docs/_product/domain-scaffold.md` — line 70 lists `'basic-stat-block'`, and a new paragraph directly after it lists the registration points (below).
- `Deleted:` none.
- `New:`
  - `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.css`
- `Moved:` none.
- `Draft:` none.

No change needed: `SessionPopupContent.tsx` and `EncounterPopupContent.tsx` omit the new optional prop. `BaseEntityPopupContent/` gains only a stylesheet beside its main file, so it still has no `index.ts` (`app/src/CLAUDE.md` — Barrel Files).

### Frontend

**`EntityPopupBody.tsx`**

- **Purpose:** an optional slot above the summary text, which knows nothing about stat blocks.
- **Behavior:**
  - `Props` gains `summaryHeader?: ReactNode`, with `import type { ReactNode } from 'react'` as `MentionPopupHeader.tsx:1` does.
  - It is destructured and rendered as delivered, with no default (`app/CLAUDE.md` — TypeScript Coding Style, exemption 1), as the first child of the existing `.entity-popup-body--summary` div, above the `TextEditor`.
  - It renders only when the summary column does (`summary !== null`).
- **UI / Visual:** no new styles. The slot scrolls with the summary inside that div.

`EntityPopupBody` receiving `summary` and `summaryHeader` stays compliant with Framework context is not a prop. It serves three popups with different data sources and cannot obtain the values itself.

**`BaseEntityPopupContent.tsx`**

- **Purpose:** feed a stat block's HP and text into the popup body.
- **Behavior:**
  - After the existing loading early return, `statBlock` is `parseBasicStatBlockContent(selected.content)` when `selected?.type === 'basic-stat-block'`, otherwise `null`.
  - A `summarySlots` object typed `Pick<React.ComponentProps<typeof EntityPopupBody>, 'summary' | 'summaryHeader'>` mirrors the file's existing `headerSlots`:
    - For a stat block: `summary` is `statBlock.textEditor` and `summaryHeader` is the HP line.
    - Otherwise: only `summary: selected?.content ?? null`.
  - `summarySlots` is spread into `EntityPopupBody`, whose `imageId` and `textEditorId` props are unchanged.
  - The HP line is a `div.base-entity-popup-content-hp` holding a `span.base-entity-popup-content-hp-label` with `BASIC_STAT_BLOCK_HP_LABEL`, followed by `statBlock.basicStatBlock.hp`. React renders `null` as nothing, so an empty HP shows only the label.
  - Imports `./BaseEntityPopupContent.css`, and `BASIC_STAT_BLOCK_HP_LABEL` and `parseBasicStatBlockContent` from `@domain`.
  - Session and Encounter popups are untouched.
- **UI / Visual:**
  - The HP line is a flex row with `--spacing-sm` between label and value, at `--font-size-base`, with `margin-bottom: var(--spacing-xs)` above the text.
  - The label is in `--color-fg-muted`.
  - The read-only editor has no gutter, so the line aligns with the text.

**`BaseEntityPopupContent.css`** — the two classes above, tokens only.

### Docs

`app/docs/_product/domain-scaffold.md`:

- Line 70 reads "each typed `'text'`, `'basic-stat-block'` or `'5e-stat-block'`".
- A new paragraph directly after it states that adding a content-section type registers it in:
  1. `BASE_ENTITY_CONTENT_SECTION_TYPES` (`domain/base-entity-content-sections/contentSectionTypes.ts`), whose order is the type menu's order.
  2. `CONTENT_SECTION_TYPE_LABELS` (`contentSectionTypeLabels.ts`).
  3. The content-schema table in `contentSectionContentSchemas.ts`: a schema that `db/base-entity-content-section/update.ts` checks on every content write, or `null` for content stored unvalidated.
  4. A body branch in `BaseEntityContentSectionPanel.tsx` and a popup branch in `BaseEntityPopupContent.tsx`, when the type's body is not the plain text editor.
  5. A bump of `SYNC_PROTOCOL_VERSION` (`domain/sync/messages.ts`), because an older build's sync schema rejects the new type and skips its rows.

The document's other statements about the content-section panel (line 224) and `BaseEntityPopupContent` (lines 48, 168) stay true and are unchanged.

## CLAUDE.md impact

- `app/CLAUDE.md` — Domain Glossary, the "Content section" bullet describes a content section as typed "`text` or `5e-stat-block`" [spec-writer_12: app/CLAUDE.md, Domain Glossary, "Content section" — as of 0c10f7f4]. Once this branch lands, `BASE_ENTITY_CONTENT_SECTION_TYPES` in `app/domain/base-entity-content-sections/contentSectionTypes.ts` also holds `'basic-stat-block'`, so the glossary under-states the section types.
- `.claude/rules/src-components.md` — Controlled inputs that drive auto-save mutations, Case 1 requires `SyncedInput` for every `Input` bound to an auto-saved value. The HP field in `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.tsx` departs from it: it is a plain `Input type='number'` wired to `useSyncedInputValue`, because `SyncedInput` omits `onFocus`/`onBlur` from its props and passes `onCommit` only the value string [spec-writer_10: app/src/components/SyncedInput/SyncedInput.tsx:9-12, 20-24 — as of 0c10f7f4]. Meanwhile a number input holding text it cannot convert reports `value` as `''` with `validity.badInput` true [spec-writer_3: https://html.spec.whatwg.org/multipage/input.html — Number state, "If the value of the element is not a valid floating-point number, then set it to the empty string instead."; "the control is suffering from bad input"]. Consequence: the rule as written forbids the only field shape that can gate saves on the input's validity or revert an unsaveable value on blur, and it names no case for such a field.
- `app/db/CLAUDE.md` — Conventions, "JSON string columns must have validated schemas" scopes itself by storage format ("When a column stores a JSON-serialised object or array"). Every `TextEditor`-backed value is `''` or Lexical's `JSON.stringify(editorState.toJSON())` [architect_4: app/src/components/TextEditor/TextEditor.tsx:126-128 — as of 0c10f7f4], and such columns are validated only as strings [architect_5: app/db/base-entity-content-section/schema.ts:32-35 — as of 0c10f7f4]. `app/domain/base-entity-content-sections/contentSectionContentSchemas.ts` validates the basic stat block's own envelope but its nested Lexical `textEditor` string only as `z.string()`, reading the rule as covering JSON whose shape this app defines. Consequence: a literal reader of the rule would demand a schema for Lexical's internal format, or flag every editor-backed column and the nested `textEditor` field as violations. The same file's Default Placement Hierarchy exception, "the schema doesn't own content structured by an external component", already draws that boundary for defaults.

## Citation record

Carried forward from the story and the architect's verdicts, then this spec's own.

- [lead_1: app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.tsx:125-139 — as of 0c10f7f4]
- [lead_2: app/docs/SPEC_CONTENT_SECTIONS.md:71 — as of 0c10f7f4]
- [lead_3: app/db/base-entity-content-section/schema.ts:32-35 — as of 0c10f7f4]
- [lead_4: app/db/_migrations/1789743068849_add_base_entity_content_sections.ts:11 — as of 0c10f7f4]
- [lead_5: app/domain/base-entity-content-sections/contentSectionTypes.ts:1-4, app/db/base-entity-content-section/schema.ts:30, app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/ContentSectionTypeMenu/ContentSectionTypeMenu.tsx:26 — as of 0c10f7f4]
- [lead_6: app/db/base-entity-content-section/update.ts:10-25 — as of 0c10f7f4]
- [lead_7: app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts:47-48 — as of 0c10f7f4]
- [lead_8: app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx:62-71, app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx:31-39 — as of 0c10f7f4]
- [lead_9: app/db/base-entity-content-section/duplicate-by-base-entity.ts:19-32 — as of 0c10f7f4]
- [lead_10: app/db/_migrations/1789743068849_add_base_entity_content_sections.ts:22-48 — as of 0c10f7f4]
- [architect_1: grep "type=['\"]number['\"]" app/src — not found]
- [architect_2: app/src/hooks/useSyncedInputValue.ts:13-40 — as of 0c10f7f4]
- [architect_3: app/src/components/SyncedInput/SyncedInput.tsx:21-24, app/src/hooks/useTypographicInput/useTypographicInput.ts:9-40 — as of 0c10f7f4]
- [architect_4: app/src/components/TextEditor/TextEditor.tsx:126-128 — as of 0c10f7f4]
- [architect_5: app/db/base-entity-content-section/schema.ts:32-35 — as of 0c10f7f4]
- [architect_6: app/db/base-entity-content-section/types.ts:8-13, app/db/base-entity-content-section/create.ts:18-31 — as of 0c10f7f4]
- [architect_7: app/db/table-config/parse-layout-row.ts:4-11 — as of 0c10f7f4]
- [architect_8: app/src/components/ErrorBoundary/ErrorBoundary.tsx:10-30 — as of 0c10f7f4; grep "\.name\b" app/src/components/ErrorBoundary/components — not found]
- [architect_9: app/db/base-entity-content-section/update.ts:10-25 — as of 0c10f7f4]
- [architect_10: @tanstack/query-core 5.104.0 src/notifyManager.ts:19, 32-39, 78-86, src/timeoutManager.ts:241-243]
- [architect_11: @tanstack/react-query 5.104.0 src/useBaseQuery.ts:95-99]
- [architect_12: @lexical/react 0.52.0 dist/LexicalOnChangePlugin.dev.js:46, 59-62; app/src/components/TextEditor/TextEditor.tsx:180 — as of 0c10f7f4]
- [architect_13: @tanstack/query-core 5.104.0 src/query.ts:892, src/queryClient.ts getQueryData]
- [architect_14: app/src/data-access-layer/queryClient.ts:11-13 — as of 0c10f7f4]
- [architect_15: app/src/components/TextEditor/plugins/ExternalValueSyncPlugin.ts:16-43 — as of 0c10f7f4]
- [architect_16: app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx:8-41 — as of 0c10f7f4; grep "import { EntityPopupBody" app/src — found SessionPopupContent, EncounterPopupContent, BaseEntityPopupContent]
- [architect_17: app/src/components/MentionPopup/components/MentionPopupHeader/MentionPopupHeader.tsx:11, app/src/components/PanelMenuBar/PanelMenuBar.tsx:10 — as of 0c10f7f4]
- [architect_18: app/services/syncService.ts:75-79 — as of 0c10f7f4]
- [architect_19: app/db/_sync/apply-upsert.ts:108-110 — as of 0c10f7f4]
- [architect_20: app/services/syncService.ts:183-203 — as of 0c10f7f4]
- [architect_21: app/domain/sync/messages.ts:7 — as of 0c10f7f4]
- [architect_22: app/src/components/ContentSectionNav/ContentSectionNav.tsx:47 — as of 0c10f7f4]
- [architect_23: grep "\.content\b" app/src — section content read only at BaseEntityContentSectionPanel.tsx:131 and BaseEntityPopupContent.tsx:63]
- [architect_24: grep "base_entity_content_sections" app/**/*.ts — found only the module's CRUD files, its migration and app/db/_sync/registry.ts]
- [architect_25: https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)]
- [architect_26: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-floating-point-number]
- [architect_27: app/src/util/typographicRules.ts:8-14 — as of 0c10f7f4]
- [architect_28: app/src/hooks/useTypographicInput/helper/applyTypographicRuleAtCaret.ts:14-32 — as of 0c10f7f4]
- [architect_29: app/src/hooks/useTypographicInput/useTypographicInput.ts:17-40 — as of 0c10f7f4]
- [architect_30: app/src/data-access-layer/useAutosaveQueue.ts:11 — as of 0c10f7f4]
- [spec-writer_1: app/node_modules/zod/v4/core/schemas.js:642 — `$ZodNumber` accepts only `typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)`]
- [spec-writer_2: app/node_modules/zod/v4/classic/schemas.d.ts:346-349, 373-377 — `int()` legacy, `z.int(): ZodInt` (`"safeint"`); app/node_modules/zod/v4/core/checks.js:93, 121 — rejects `!Number.isInteger`, then `!Number.isSafeInteger`]
- [spec-writer_3: https://html.spec.whatwg.org/multipage/input.html — Number state value sanitization ("If the value of the element is not a valid floating-point number, then set it to the empty string instead."), bad input, "The default step is 1"]
- [spec-writer_4: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html — valid floating-point number grammar; `1.` and a lone `-` are not valid]
- [spec-writer_5: app/node_modules/react-dom/cjs/react-dom-client.development.js:1850-1853 — for `"number" === type`, `element.value` is written only when `(0 === value && "" === element.value) || element.value != value`]
- [spec-writer_6: app/node_modules/typescript/lib/lib.dom.d.ts:37711 — `readonly badInput: boolean` on `ValidityState`]
- [spec-writer_7: https://html.spec.whatwg.org/multipage/input.html — Number state: `selectionStart`, `selectionEnd`, `selectionDirection`, `setRangeText()`, `setSelectionRange()` do not apply]
- [spec-writer_8: https://html.spec.whatwg.org/multipage/forms.html#the-label-element — label content model and labeled control without `for`]
- [spec-writer_9: ran `npx tsc --noEmit` and `npx eslint <scratch files>` from `app/` on disposable scratch implementations of the Sub-feature 1 domain signatures (incl. a `ZodObject` assigned to `z.ZodType | null`) and the Sub-feature 4 HP field wiring (`readSaveableHp` taking `event.currentTarget`, keyed `Input type='number'`) — observed tsc exit 0, and eslint reporting only `local/no-unused-exports` and `local/no-import-past-index` caused by the scratch files' own placement; scratch files deleted]
- [spec-writer_10: app/src/components/SyncedInput/SyncedInput.tsx:9-12, 20-24 — as of 0c10f7f4]
- [spec-writer_11: app/eslint-rules/no-unused-exports.js:199-226, 272, 384-400 — an export is reported unless some file imports it directly or through a chain of barrels; re-export statements are skipped and reported in their own file — as of 0c10f7f4]
- [spec-writer_12: app/CLAUDE.md, Domain Glossary, "Content section" — as of 0c10f7f4]
