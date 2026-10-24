# Spec: 5e Stat Block fields

Branch `feat/five-e-stat-block`. Paths are relative to `app/` unless they start with `.claude/`. Visual reference: the outline in commit `ff9df60e` (screenshots `outline-top.jpg`, `outline-scrolled.jpg` in `.claude/cycles/2026-10-24-five-e-stat-block-lead/`); the look is frozen, the code behind it is rewritten.

- Sub-feature 1: Content model, registration and sync bump — a total-read 5e content module, the shared whole-number parser, the 5e schema registered, protocol version 3, duplication fixture made valid
- Sub-feature 2: Whole-number helper promotion — HP-named parser and DOM wrapper become generic and shared, Basic Stat Block rewired
- Sub-feature 3: Saved fields — number and text field components, sub-components bound to them, body parses once, folder boundary cleaned
- Sub-feature 4: Read-only layout — column pinning and collapse of hidden rows, hand verification against the outline
- Sub-feature 5: Docs — feature page, stale statements in two feature pages, glossary

## Key Architectural Decisions (KAD)

Citations: [spec-writer_1: ran `npx tsc --noEmit` and `npx eslint` from `app/` on a scratch copy of the SF1 domain contract block — tsc exit 0; eslint reported only `no-unused-vars` for the tuples (used at runtime in the real file) and `no-unused-exports` for exports whose consumers SF1 to SF3 add]; [spec-writer_2: `app/src/data-access-layer/useAutosaveQueue.ts:9,14` — the queue is created in `useState`'s initializer per hook call and `flushAll()` runs in the unmount cleanup]; [spec-writer_3: `.claude/knowledge/zod.md:45` — `z.int()` rejects integers outside the safe range]; [spec-writer_4: `.claude/knowledge/jsdom.md:10` — jsdom has no ArrowUp or ArrowDown handling on a number input]; [spec-writer_5: `app/eslint-rules/no-unused-exports.js:340-347` — every non-declaration, non-`node_modules` program source file, tests included, counts as an importer]; [spec-writer_6: `app/src/CLAUDE.md` — Testing Policy, Forbidden bullet — as of ff9df60e]; spec-writer_7 to spec-writer_9 are cited where used.

### Content is one JSON value with flat keys

Stored in the section's existing `content` as `{ fiveEStatBlock: { <key>: value } }`, 16 number keys (`z.int().nullable()`) and 7 text keys (`z.string()`), registered in `CONTENT_SECTION_CONTENT_SCHEMAS`; no migration, no `textEditor` sibling, no Size. Alt A, C10.

### The 5e read is total and the first edit overwrites legacy content

`readFiveEStatBlockContent` returns all-empty (numbers `null`, texts `''`) for `null`, unparseable text, and JSON failing the schema (Lexical state included); `patchFiveEStatBlockContent` composes against that read. `update.ts` still validates every write. C1, row 8.

### A field added to the schema later must carry a zod default

Any new required key makes every stored 5e section read as empty, which is the behaviour specified for legacy text. The feature page (SF5) records this constraint. C2.

### Text fields use `SyncedInput`; the saved value is what the field shows

`--`, `->` and `<-` are rewritten as the user types, and nothing is trimmed on save. Row 9, C3.

### Number fields use `useSyncedInputValue` in one component

`FiveEStatBlockNumberField` owns the local text, the remount-on-revert key and `badInput` detection; 16 call sites use it. Alt B, C4.

### The whole-number rule is shared and generic

`parseWholeNumberInput` (domain) and `readSaveableWholeNumber` (`ContentSectionBody/helper/`, shared by sibling bodies per the Util vs. Helper ladder) replace `parseBasicStatBlockHpInput` and `readSaveableHp`. C4.

### `parseBasicStatBlockHpInput` is removed, not kept as a delegate

After SF2 its only caller is gone, and `local/no-unused-exports` reports an export nothing imports [spec-writer_5]; its tests move to `wholeNumberInput.test.ts`. Dead-code removal per the shared Best Practices rule.

### A number beyond the safe-integer range is unsaveable

`z.int()` rejects it [spec-writer_3] and the field reverts on blur, as Basic HP does. Row 12, C5.

### `FiveEStatBlockNumberField` renders the input only; callers own the label

The Abilities cell wraps a label span and two inputs in one `label` element, and the Base Stats row wraps a label span and one input; a field component rendering its own label could not serve both without changing the outline's markup and its CSS. A number field is never hidden, so no label has to disappear with it; `FiveEStatBlockTextField` renders its label because a hidden text field hides its label too (row 6).

### The body parses once and passes each field its saved value

`FiveEStatBlockSectionBody` calls `readFiveEStatBlockContent(section.content)` once and passes the inner record down as `values`; a field never parses. Alt C.

### Every write composes against the cached content

`FiveEStatBlockSectionBody` calls `useBaseEntityContentSections(baseEntityId)` once and defines `saveField(key, value)`, which saves through `updateSectionContent(section.id, (current) => patchFiveEStatBlockContent(current, key, value))`, never against the rendered `section.content`; the four groups and both field components receive `saveField` and never call the hook. One hook instance owns one autosave queue, and a second instance would flush its own pending content patch out of edit order on unmount [spec-writer_2]. C8, Alt D (no shared state-wiring hook; the roughly ten lines of number-input wiring in `BasicStatBlockSectionBody` and `FiveEStatBlockNumberField` stay separate copies because extracting a hook would modify the Basic body, which is out of scope).

### The 5e case is keyed by `section.id`

C7.

### Read-only rendering

An empty number field keeps its label and drops its placeholder (row 5); a text field whose value is blank after `trim()` renders nothing, label included, and the stored text is never trimmed (rows 6, 11); Speed and Creature Type are pinned to their own grid columns and a childless row or wrapper collapses (row 10, C6).

### The sync protocol version goes from 2 to 3

Row 7, C9.

### The outline's defects are dropped

Duplicate and misspelled keys, `maxLength` (no effect on `type=number`), unbound inputs, the commented-out Size field and CSS, `type='text'` (the browser default), the label typo "Resistences:". Row 4, C10.

### The folder boundary of `FiveEStatBlockSectionBody` is corrected

`components/index.ts` is deleted (a function-grouping folder below a layer root never has an `index.ts`, `app/CLAUDE.md` — Directory Structure) and the module gets an `index.ts` because it holds more than one main file besides its stylesheet (`app/src/CLAUDE.md` — Barrel Files), as `BasicStatBlockSectionBody` does. Violation found by the Modified-file scan.

### Per-sub-component field lists are module-private

The label and placeholder lists that Base Stats row one maps over, and the six ability keys that Abilities maps over, are `const` lists in the file that renders them: one consumer each, and iteration data of the render rather than a separate concern.

## Sub-feature 1: Content model, registration and sync bump

Adds the data layer; nothing renders it yet. `parseWholeNumberInput` is consumed by SF2's `readSaveableWholeNumber`; `readFiveEStatBlockContent` and the key types by SF3 (`index.ts` exports for them are added there, where an importer exists). Until then each is imported by its test file, which counts for `local/no-unused-exports` [spec-writer_5].

### Files affected

- New: `domain/base-entity-content-sections/wholeNumberInput.ts`
- New: `domain/base-entity-content-sections/__tests__/wholeNumberInput.test.ts`
- New: `domain/base-entity-content-sections/fiveEStatBlockContent.ts`
- New: `domain/base-entity-content-sections/__tests__/fiveEStatBlockContent.test.ts`
- Modified: `domain/base-entity-content-sections/contentSectionContentSchemas.ts` — `'5e-stat-block': fiveEStatBlockContentSchema`
- Modified: `domain/base-entity-content-sections/__tests__/contentSectionContentSchemas.test.ts` — add 5e cases
- Modified: `domain/base-entity-content-sections/index.ts` — explicit named export of `patchFiveEStatBlockContent` (module barrel; the file uses explicit named exports)
- Modified: `domain/sync/messages.ts` — `SYNC_PROTOCOL_VERSION = 3`
- Modified: `db/base-entity-content-section/__tests__/duplicate-by-base-entity.test.ts` — the seeded 5e section's `content: 'c'` stops passing `assertValidContentSectionContent` once the schema is registered, so `update(second, …)` would throw; seed it with `patchFiveEStatBlockContent(null, 'speed', '30 ft.')` (imported from `@domain`), name that value in a const used for both the seed and the expected `Section B` row; Section A (type `text`) keeps `'c'`. Behaviour: the existing copy test now asserts 5e content survives duplication byte for byte — defect: a copy that re-serialises or drops the content.

### Domain layer

`wholeNumberInput.ts` exports `parseWholeNumberInput(raw: string)` returning `{ valid: true; value: number | null } | { valid: false }`: blank after `trim()` gives `{ valid: true, value: null }`; otherwise `z.int()` (the same schema `basicStatBlockContent.ts` calls `hpSchema`) applied to `Number(raw)`; failure gives `{ valid: false }`. It is the moved body of `parseBasicStatBlockHpInput` with `hp` renamed `value`; `basicStatBlockContent.ts` is untouched in this SF.

`fiveEStatBlockContent.ts` exports the contract below. The two tuples are module-private, used at runtime to build the zod shape and the all-empty value, and are the single source of the 23 key names. [spec-writer_1]

```ts
const NUMBER_KEYS = [
  'hp', 'ac', 'initiative', 'proficiencyBonus',
  'strMod', 'strSave', 'dexMod', 'dexSave', 'conMod', 'conSave',
  'intMod', 'intSave', 'wisMod', 'wisSave', 'chaMod', 'chaSave',
] as const;
const TEXT_KEYS = [
  'speed', 'creatureType', 'resistances', 'immunities',
  'senses', 'skills', 'languages',
] as const;

export type FiveEStatBlockNumberKey = (typeof NUMBER_KEYS)[number];
export type FiveEStatBlockTextKey = (typeof TEXT_KEYS)[number];
export type FiveEStatBlockContent = {
  fiveEStatBlock: Record<FiveEStatBlockNumberKey, number | null> &
    Record<FiveEStatBlockTextKey, string>;
};

export declare const fiveEStatBlockContentSchema: z.ZodType<FiveEStatBlockContent>;
export declare const readFiveEStatBlockContent: (content: string | null) => FiveEStatBlockContent;
export declare const patchFiveEStatBlockContent: <K extends FiveEStatBlockNumberKey | FiveEStatBlockTextKey>(
  content: string | null,
  key: K,
  value: FiveEStatBlockContent['fiveEStatBlock'][K],
) => string;
```

The block is prettier-formatted when written to the file (it is shown compact here). `readFiveEStatBlockContent` never throws: `null`, a `JSON.parse` failure and a `safeParse` failure all return the all-empty value. `patchFiveEStatBlockContent` returns `JSON.stringify` of the read content with `key` replaced. The schema is a `z.object({ fiveEStatBlock: z.object(…) })` over both tuples. Only the type names, `readFiveEStatBlockContent` and `patchFiveEStatBlockContent` leave the module through the barrel (SF1 and SF3); `fiveEStatBlockContentSchema` is imported by `contentSectionContentSchemas.ts` directly, as `basicStatBlockContentSchema` is.

Behaviours `fiveEStatBlockContent.test.ts` covers (the implementer derives names and assertions):

- null content reads all-empty — defect: a Basic-style parse throws or returns a partial object.
- Unparseable text (old free text) reads all-empty — defect: the `SyntaxError` propagates and the section shows the error screen.
- Lexical editor JSON (valid JSON, wrong shape) reads all-empty — defect: only the `JSON.parse` failure is caught, so a `ZodError` propagates.
- Valid stored content reads back every field — defect: the read discards or renames stored values.
- Patching legacy content replaces it, leaving every other field empty — defect: patch composes against the raw string and throws, or keeps stale legacy data.
- Patching one number key and one text key keeps the other fields — defect: patch rebuilds from empty instead of the current content (a lost field).

`contentSectionContentSchemas.test.ts` adds: accepts the output of `patchFiveEStatBlockContent(null, 'hp', 7)` — defect: the table still holds `null` or rejects the real shape; throws on a 5e envelope whose `hp` is `1.5` — defect: the registered schema allows non-integers; throws on non-JSON for `'5e-stat-block'` — defect: the type is still treated as unvalidated.

`wholeNumberInput.test.ts` covers: blank and whitespace-only read as valid empty — defect: `Number('')` is `0`, so blank saves 0; a negative whole number is accepted — defect: a sign-rejecting pattern; `1.5` and `abc` are rejected — defect: truncation or `NaN` accepted; a 20-digit string is rejected — defect: the integer check loosened to `z.number()`, so an unsafe value saves and loses precision [spec-writer_3].

**Database layer**: only the test fixture above; `duplicate-by-base-entity.ts` is unchanged (it copies every column).

`domain/sync/messages.ts` is a constant bump with no branch, and no existing test names the version [spec-writer_7: `grep SYNC_PROTOCOL_VERSION app/domain/sync/__tests__/messages.test.ts` — not found], so no test file changes.

## Sub-feature 2: Whole-number helper promotion

Behaviour-neutral refactor of the Basic Stat Block's HP input path. Consumers of `parseWholeNumberInput` (SF1): `readSaveableWholeNumber`. Consumers of `readSaveableWholeNumber`: `BasicStatBlockSectionBody` here, `FiveEStatBlockNumberField` in SF3.

### Files affected

- Moved: `mv src/components/ContentSectionBody/components/BasicStatBlockSectionBody/helper/readSaveableHp.ts src/components/ContentSectionBody/helper/readSaveableWholeNumber.ts`, then rename the export to `readSaveableWholeNumber`, import `parseWholeNumberInput` from `@domain`, and type the return as `ReturnType<typeof parseWholeNumberInput>`
- Moved: `mv src/components/ContentSectionBody/components/BasicStatBlockSectionBody/helper/__tests__/readSaveableHp.test.ts src/components/ContentSectionBody/helper/__tests__/readSaveableWholeNumber.test.ts`, then update the import, the `describe` name, and the expected saveable-empty result from `{ valid: true, hp: null }` to `{ valid: true, value: null }`
- Modified: `src/components/ContentSectionBody/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.tsx` — import `readSaveableWholeNumber` from `../../helper/readSaveableWholeNumber`; the two call sites use the new name; `const { hp } = hpInput` becomes `const { value: hp } = hpInput`; the comment above the change handler names `readSaveableWholeNumber` and `parseWholeNumberInput(value)`
- Modified: `domain/base-entity-content-sections/basicStatBlockContent.ts` — delete `parseBasicStatBlockHpInput` and the `BasicStatBlockHpInput` type; `hpSchema` stays (used by `basicStatBlockContentSchema`)
- Modified: `domain/base-entity-content-sections/__tests__/basicStatBlockContent.test.ts` — delete the `parseBasicStatBlockHpInput` import and its `describe` block (the last block of the file); its assertions live in `wholeNumberInput.test.ts`
- Modified: `domain/base-entity-content-sections/index.ts` — remove `parseBasicStatBlockHpInput`, add `parseWholeNumberInput` from `./wholeNumberInput` (explicit named export)

`BasicStatBlockSectionBody/index.ts` needs no change: it exports only `BasicStatBlockSectionBody` and does not name the helper [spec-writer_8: `app/src/components/ContentSectionBody/components/BasicStatBlockSectionBody/index.ts` — as of ff9df60e, its only line is `export { BasicStatBlockSectionBody } from './BasicStatBlockSectionBody';`].

**Domain layer**: as listed. **Frontend layer**: as listed.

Behaviours `readSaveableWholeNumber.test.ts` keeps (moved, not new): unconvertible text reported as `badInput` is unsaveable instead of a cleared value — defect: reading the empty `value` alone saves an empty field when the user typed `-` or `1.`; a deliberately cleared field is saveable and empty — defect: blank is treated as unsaveable and reverts; a convertible decimal is rejected — defect: the whole-number check skipped.

## Sub-feature 3: Saved fields

Number and text field components, the four sub-components bound to them, the body wired to the parsed content, `key={section.id}` on the 5e case.

### Files affected

- New: `src/components/ContentSectionBody/components/FiveEStatBlockSectionBody/components/FiveEStatBlockNumberField/FiveEStatBlockNumberField.tsx`
- New: `…/FiveEStatBlockNumberField/__tests__/FiveEStatBlockNumberField.test.tsx`
- New: `…/components/FiveEStatBlockTextField/FiveEStatBlockTextField.tsx`
- New: `…/FiveEStatBlockTextField/__tests__/FiveEStatBlockTextField.test.tsx`
- New: `src/components/ContentSectionBody/components/FiveEStatBlockSectionBody/types.ts` — `FiveEStatBlockGroupProps`
- New: `src/components/ContentSectionBody/components/FiveEStatBlockSectionBody/__tests__/FiveEStatBlockSectionBody.test.tsx`
- New: `src/components/ContentSectionBody/components/FiveEStatBlockSectionBody/index.ts` — `export { FiveEStatBlockSectionBody } from './FiveEStatBlockSectionBody';`
- Deleted: `…/FiveEStatBlockSectionBody/components/index.ts` — a function-grouping folder never has an `index.ts`
- Modified: `…/FiveEStatBlockSectionBody/FiveEStatBlockSectionBody.tsx` — parse once, call the data hook once and define `saveField`, pass `FiveEStatBlockGroupProps`, import the four sub-components by file path (`./components/FiveEStatBlockBaseStats/FiveEStatBlockBaseStats`, and likewise for the other three); replace the stale comment above the component (it says the body renders as a plain text editor) with one stating it renders the structured 5e fields
- Modified: `…/components/FiveEStatBlockBaseStats/FiveEStatBlockBaseStats.tsx`, `…/FiveEStatBlockAbilities/FiveEStatBlockAbilities.tsx`, `…/FiveEStatBlockDefenses/FiveEStatBlockDefenses.tsx`, `…/FiveEStatBlockMisc/FiveEStatBlockMisc.tsx` — bound to the two field components
- Modified: `…/FiveEStatBlockAbilities/FiveEStatBlockAbilities.css` — delete the two commented-out declarations (`/*grid-template-rows…*/`, `/*flex-direction: column;*/`)
- Modified: `src/components/ContentSectionBody/ContentSectionBody.tsx` — import `FiveEStatBlockSectionBody` from `./components/FiveEStatBlockSectionBody`; add `key={section.id}` to the `5e-stat-block` case with a comment like the Basic case's (switching between two 5e sections remounts the body and resets its local field text)
- Modified: `domain/base-entity-content-sections/index.ts` — explicit named exports of `readFiveEStatBlockContent` and `type FiveEStatBlockContent`, `type FiveEStatBlockNumberKey`, `type FiveEStatBlockTextKey` (SF1 added `patchFiveEStatBlockContent`)

The sub-component CSS files other than Abilities are unchanged here (SF4). Modified-file scan: the four sub-components and the body have no inline sub-component and no void `return null`; `components/index.ts` was the only violation (handled above).

### Frontend layer

`types.ts` declares `FiveEStatBlockGroupProps = { readOnly: boolean; values: FiveEStatBlockContent['fiveEStatBlock']; saveField: <K extends FiveEStatBlockNumberKey | FiveEStatBlockTextKey>(key: K, value: FiveEStatBlockContent['fiveEStatBlock'][K]) => void }` (the same generic shape as `patchFiveEStatBlockContent`, so a number key accepts only `number | null` and a text key only `string`) (shared by the four sub-components, so it lives in a neutral file they import, not in the parent component). Each sub-component takes `FCProps<FiveEStatBlockGroupProps>`.

### FiveEStatBlockSectionBody

- **Purpose**: renders the four groups in the outline's order from one parsed content.
- **Behavior**: `const { fiveEStatBlock } = readFiveEStatBlockContent(section.content)` once per render; calls `useBaseEntityContentSections(baseEntityId)` once for `updateSectionContent` and defines `const saveField: FiveEStatBlockGroupProps['saveField'] = (key, value) => updateSectionContent(section.id, (current) => patchFiveEStatBlockContent(current, key, value))`; passes `readOnly`, `values={fiveEStatBlock}`, `saveField` to each group. No other state. Code comments to write at the construct, naming the failure mode and never the spec: (a) at `saveField`, that composing against the rendered section content would let a quick edit in another field overwrite this one; (b) at the hook call, that one hook instance owns one autosave queue and a second instance would flush its own pending content patch out of edit order on unmount, so the fields take `saveField` instead of calling the hook.
- **UI / Visual**: unchanged wrapper and CSS.

### FiveEStatBlockNumberField

- **Purpose**: one saved whole-number input (16 uses).
- **Props**: `{ saveField: FiveEStatBlockGroupProps['saveField']; field: FiveEStatBlockNumberKey; placeholder: string; savedValue: number | null; readOnly: boolean }`.
- **Behavior**: no data hook; `useSyncedInputValue(savedValue === null ? '' : String(savedValue))`; a `useState` revision used as the input's `key`, incremented on every revert. `onChange`: `setValue(event.currentTarget.value)`, then `readSaveableWholeNumber(event.currentTarget)`; when `valid`, `saveField(field, input.value)`. `onFocus` and `onBlur` spread from `focusProps`; on blur when the reading is not valid, `setValue` to the saved text and bump the revision. Accepts empty or any whole number, negatives included; a decimal or unconvertible text saves nothing. Read-only: `readOnly` on the input and no `placeholder` (`readOnly ? undefined : placeholder`, a DOM attribute whose type admits `undefined`).
- **UI / Visual**: one `<Input className='number-input' type='number' />`, no label; the arrows stay hidden by the global `.number-input` class and ArrowUp and ArrowDown step natively. `placeholder` is the outline's string at each call site (listed under the groups).
- Code comments to write at the construct, naming the failure mode and never the spec: (b) at the revision `key`, that React rewrites a number input's text only when its DOM value differs and unconvertible text already reads `''`, so a revert to empty would otherwise leave `-` or `1.` on screen [spec-writer_9: `.claude/knowledge/react.md:62` — react-dom writes a controlled number input's value only when it differs loosely from the bound value]; (c) at the `readSaveableWholeNumber` call, that `value` alone reads unconvertible text as a cleared field.

### FiveEStatBlockTextField

- **Purpose**: one saved text input with its label (7 uses).
- **Props**: `{ saveField: FiveEStatBlockGroupProps['saveField']; field: FiveEStatBlockTextKey; label: string; placeholder: string; savedValue: string; readOnly: boolean }`.
- **Behavior**: no data hook; when `readOnly && savedValue.trim() === ''` returns `null`. Otherwise `<SyncedInput initValue={savedValue} onCommit={(text) => saveField(field, text)} readOnly={readOnly} placeholder={placeholder} />` — the committed string is what the field shows, never trimmed. The editable field is never hidden.
- **UI / Visual**: `<label><span className='label'>{label}</span><SyncedInput /></label>`; no `type` attribute (`text` is the default). The body CSS selectors (`.five-e-stat-block-section-body label`) style it as in the outline.

### Groups

- **FiveEStatBlockBaseStats**: row one `div.five-e-stat-block-base-stats-row-one` maps a module-private list of `{ field, label, placeholder }` — `hp`/`HP:`/`000`, `ac`/`AC:`/`00`, `initiative`/`Initiative:`/`0`, `proficiencyBonus`/`Proficiency Bonus:`/`0` — to `<label key={field}><span className='label'>{label}</span><FiveEStatBlockNumberField … savedValue={values[field]} /></label>`. Row two `div.five-e-stat-block-base-stats-row-two` holds `FiveEStatBlockTextField` for `speed` (`Speed:`, `30, Fly 60`) then `creatureType` (`Creature Type:`, `Large Monstrosity`). The commented-out Size field is deleted.
- **FiveEStatBlockAbilities**: the header `div` (empty cell, `MOD`, `SAVE`) is unchanged; a module-private tuple `['str', 'dex', 'con', 'int', 'wis', 'cha'] as const` is mapped to `<label key={ability}><span className='label'>{ability.toUpperCase()}</span>` plus two `FiveEStatBlockNumberField`s for `` `${ability}Mod` `` and `` `${ability}Save` `` (typed with `as const` so each is a `FiveEStatBlockNumberKey`), placeholder `0`.
- **FiveEStatBlockDefenses**: wrapper `div.five-e-stat-block-defenses` holding `FiveEStatBlockTextField` for `resistances` (`Resistances:`, `e. g. non-magical damage`) and `immunities` (`Immunities:`, `e.g. Poison, Fire, Radiant`).
- **FiveEStatBlockMisc**: wrapper `div.five-e-stat-block-misc` holding `senses` (`Senses:`, `e.g. passive Perception 16, Darkvision 60 ft.`), `skills` (`Skills:`, `e.g. Perception +5`), `languages` (`Languages:`, `e.g. Common, Elvish, Giant`).

Every label string, placeholder string and class name already in the outline stays as written, except the typo and the two new wrapper classes.

**Tests** (rendered with `render` from `@testing-library/react`). The field tests pass a `vi.fn()` spy as `saveField`; no module mock and no query-client wrapper. The body test mocks `@/data-access-layer` returning `useBaseEntityContentSections: () => ({ updateSectionContent })` with a `vi.hoisted` spy, as `src/components/MentionPopup/__tests__/MentionPopup.test.tsx` mocks that module. "What gets saved" in the body test is the string returned by calling the captured `compose` callback and passing it to `readFiveEStatBlockContent`.

`FiveEStatBlockNumberField.test.tsx` — one test per criterion this component's event handling decides:

- Typing a whole number calls `saveField` with the field's key and the number — defect: the key or value is wrong, or the number is passed as text.
- Clearing the field calls `saveField` with `null` — defect: blank read as invalid, or saved as 0.
- Typing a decimal does not call `saveField`, and on blur the field shows the saved value again — defect: a decimal is truncated and saved, or the typed text stays after blur.

`FiveEStatBlockTextField.test.tsx`:

- Typing calls `saveField` with the field's key and the text, a trailing space included — defect: the value is trimmed before saving.

`FiveEStatBlockSectionBody.test.tsx`:

- Editing a field calls `updateSectionContent` with the section's id, and the saved content is composed from the `current` string the callback receives, not from the rendered `section.content` — defect: composing against the rendered content drops another field's concurrent edit.
- Editing a number field and a text field in turn composes both against successive `current` values, so the second result holds both fields — defect: the second save rebuilds from the stale render and loses the first edit.

[MANUAL-VERIFY] Block layout against the outline (labels, placeholders, column proportions, spacing, label style) — compare `pnpm run web` on a foe screen at the browser pane's default size with the two screenshots.
[MANUAL-VERIFY] No stepping arrows on any of the 16 number fields — layout the test environment does not compute.
[MANUAL-VERIFY] ArrowUp and ArrowDown in a focused number field step by one — jsdom has no key handling on a number input [spec-writer_4].
Criterion check in the browser pane (`pnpm run web`; a sequence of event handling and persistence, not layout): change Speed, then HP, then switch to another section within 500 ms, then reload the page — both changes are still there. The body holds one hook instance and so one autosave queue [spec-writer_2]; a failure here is reported to the caller, not worked around.
[MANUAL-VERIFY] Switching to another section and back, and a browser reload against the dev data server's persisted copy, keep every field's value (the reload stands in for restarting the app). Restarting the Tauri app is a hand-off item for the human tester.

## Sub-feature 4: Read-only layout

CSS only, plus one prop. The `FiveEStatBlockTextField` `className` prop's consumer is `FiveEStatBlockBaseStats` here.

### Files affected

- Modified: `…/components/FiveEStatBlockTextField/FiveEStatBlockTextField.tsx` — add optional `className?: string` to the props, applied to the `label`
- Modified: `…/components/FiveEStatBlockBaseStats/FiveEStatBlockBaseStats.tsx` — pass `className='five-e-stat-block-base-stats-speed'` to the Speed field and `'five-e-stat-block-base-stats-creature-type'` to Creature Type
- Modified: `…/components/FiveEStatBlockBaseStats/FiveEStatBlockBaseStats.css`
- Modified: `…/components/FiveEStatBlockDefenses/FiveEStatBlockDefenses.css` (currently empty)
- Modified: `…/components/FiveEStatBlockMisc/FiveEStatBlockMisc.css` (currently empty)

**Frontend layer** (CSS, flat BEM-ish names, no raw design values added):

- Base Stats: `.five-e-stat-block-base-stats-speed { grid-column: 1; }`, `.five-e-stat-block-base-stats-creature-type { grid-column: 2; }`, and `.five-e-stat-block-base-stats-row-two:empty { display: none; }` (its specificity beats `.five-e-stat-block-base-stats div { display: grid; }`). Comment at the pinning rules: without it a hidden Speed lets Creature Type auto-place into the narrow first column and a childless row leaves a blank band from the body's flex gap.
- Defenses and Misc: `.five-e-stat-block-defenses:empty { display: none; }` and `.five-e-stat-block-misc:empty { display: none; }`.

The row-one number fields and the Abilities grid never hide, so they need no collapse rule.

[MANUAL-VERIFY] In the mention popup (read-only): with only Creature Type filled, it stays in the wide column and Speed leaves no gap — layout the test environment does not compute.
[MANUAL-VERIFY] In the popup with all of Speed and Creature Type blank (or spaces only), row two leaves no blank band; likewise Defenses with both blank and Misc with all three blank.
[MANUAL-VERIFY] In the popup an empty number field shows its label and no placeholder; a text field with text shows label and text.

These run in the browser pane (`pnpm run web`), which an agent session can drive (`app/docs/features/web-dev-mode.md`).

## Sub-feature 5: Docs

### Files affected

- New: `docs/features/five-e-stat-block.md` — mirrors the headings of `docs/features/basic-stat-block.md` (Purpose, How it works, Data, Rules, Open points, Where to look). Must state: the field set and layout; each text field autosaves with `--`, `->` and `<-` rewritten as typed and no trimming; number-field rules (empty or whole number, negatives included, unsaveable input not saved and reverted on blur, safe-integer bound of about 16 digits); read-only rules (empty number keeps label without placeholder, blank text hidden with its label, columns kept, empty rows collapse); old free text reads as empty and the first edit replaces it; duplication copies fields; sync protocol version 3 and why (devices on builds from before and after pause sync until both upgrade); the schema-evolution constraint (a field added later must carry a zod default); no Size, ability scores or derived values.
- Modified: `docs/features/basic-stat-block.md` — line 28 "the sync protocol version is 2" becomes "is 3 (raised from 2 by the 5e Stat Block, see `five-e-stat-block.md`)"; rows at lines 40 and 48 ("Text and 5e Stat Block sections … as before", "the existing "5e Stat Block" type stays a plain text section") get "; superseded by `five-e-stat-block.md`" appended; line 86 drops "the HP rule" from `basicStatBlockContent`'s description and names `wholeNumberInput` (the whole-number rule); lines 89 and 90 name `readSaveableWholeNumber` (under `app/src/components/ContentSectionBody/helper/`) instead of `readSaveableHp`.
- Modified: `docs/features/content-section-bodies.md` — step 1 (line 9) and step 2 (line 10) say a 5e Stat Block is a text editor: change to the structured fields body; rule rows at lines 30 and 56 updated the same way, line 30's "`readSaveableHp` tests" becoming `readSaveableWholeNumber`; lines 66 and 69 name `readSaveableWholeNumber`.
- Modified: `docs/glossary.md` — add the term "5e stat block" (content-section type `5e-stat-block`: fixed saved fields for a foe's 5e stats, one JSON value in the section's content; see `features/five-e-stat-block.md`).

Run `pnpm run markdown-fix` from the repository root after editing tables, then `markdown-lint`.

`docs/_product/domain-scaffold.md` is read through whole: its content-section registration list (items 1 to 5) and the sentence on section types stay true after this feature, so it is not modified.

## CLAUDE.md impact

- `app/src/CLAUDE.md` — Testing Policy forbids component tests except for a criterion only the component's event handling decides; the read-only rules of the 5e Stat Block (text field hidden when blank, placeholder dropped on number fields) are decided by props at render time, so no automated test covers them and a regression passes the suite; they are checked by hand in the browser pane. [spec-writer_6: `app/src/CLAUDE.md` — Testing Policy, Forbidden bullet — as of ff9df60e]
- `.claude/rules/src-components.md` — "Framework context is not a prop" has components call the data hook themselves, while `useBaseEntityContentSections` creates one autosave queue per call and `flushAll`s it on unmount [spec-writer_2]; several sibling components that each call it for one section's content can flush full-content writes out of edit order. The rule covers values and callbacks that are identical wherever obtained (shared cache reads, URL params); a callback returned by a hook that owns per-instance deferred-write state (the autosave queue held through `useAutosaveQueue`) is not identical per call, so the parent that owns the section's writes calls the hook once and passes the save callback down, as this spec does in `FiveEStatBlockSectionBody` and as `BasicStatBlockSectionBody` does with one instance for both its HP input and its text editor. The rule text does not state this; this is an instruction gap, left to a dedicated instruction pass, and the spec does not ask for an exception that permits per-field calls.
- `app/CLAUDE.md` — Domain Glossary: the Content section entry lists the types as "`text` or `5e-stat-block`" and omits `basic-stat-block`; this spec does not change that entry.

## Notes

A DAL-wide fix for flush order across hook instances is out of scope. Any future body with several instances of a deferred-save hook hits the same hazard, which is why this body holds one.
