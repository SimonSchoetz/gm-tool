# Spec: One body component per content section type, shared by panel and popup

- Sub-feature 1: Shared section bodies — create `ContentSectionBody` with its three type bodies in `app/src/components/` and switch the base entity screen's panel to it
- Sub-feature 2: Popup without a summary concept — render sections in the mention popup through `ContentSectionBody`, rename the read-only text body, delete the summary helpers
- Sub-feature 3: Feature pages and scaffold — bring the two feature pages and the domain scaffold's content-section registration step to the new structure

No sub-feature is a Foundation SF: SF1 only adds the new module and moves the panel onto it, so every `every check` row passes after each sub-feature on its own.

## Key Architectural Decisions

### Three type bodies plus one dispatcher, in `app/src/components/ContentSectionBody/`

`ContentSectionBody` dispatches on `section.type` to `TextSectionBody`, `BasicStatBlockSectionBody` and `FiveEStatBlockSectionBody`, which nest under it in `components/`; the panel and the popup render only `ContentSectionBody`. Verdict R1; story row 30. Placement: `.claude/rules/src-components.md` — Sub-component ownership (consumers `screens/base-entity/...` and `components/MentionPopup/...`, nearest shared ancestor `app/src/components/`).

### `baseEntityId` is a prop, `section` is a prop, `readOnly` is a boolean

Props of every body: `section: BaseEntityContentSection`, `baseEntityId: string`, `readOnly: boolean`. Verdict R2 (the popup has no route, so `useParams` is not available; `.claude/rules/src-components.md` — Framework context is not a prop does not apply when the receiver cannot read the value). `readOnly` is a two-state mode, not a variant list, so no union prop applies.

### Dispatcher owns the size limits; the caller passes its own margin

`ContentSectionBody` owns `max-height`, `max-width` and `overflow-y` and the `display: flex` the stat block body's `flex: 1` needs, in the class `content-section-body`. The panel's margin (`var(--spacing-sm)`, left margin 0) is the panel's own context and arrives through `className`, defined in the panel's CSS. Verdict C4.

### `EntityPopupBodyText` repeats the three size limits in its own class

`EntityPopupBodyText` (Session and Encounter popups, no section) declares `max-height`, `max-width` and `overflow-y` with the same three tokens as `content-section-body`. Separate copies are intended: the two modules have no common parent that could own a class, and a CSS file cannot import another's rule; the values are tokens, not literals. Verdict C4, ruling 7 of the brief.

### Placeholder only when editable; no gutter padding when read-only

Editable bodies pass `CONTENT_SECTION_EDITOR_PLACEHOLDER`, read-only bodies pass no placeholder (a read-only `TextEditor` renders none: `app/src/components/TextEditor/TextEditor.tsx:159`). The read-only Basic Stat Block HP row carries no gutter padding, because a read-only `TextEditor` has gutter width `0` (`app/src/components/TextEditor/TextEditor.tsx:148`). Verdict C2, C3; story rows 31, 32.

### Editor ids include the mode

Text and 5e bodies use `textEditorId` `content-section-<section.id>-edit` / `-read`; the Basic Stat Block body uses `basic-stat-block-<section.id>-edit` / `-read`. The panel and the popup can show one section at once and `TextEditor` uses the id as Lexical namespace and remount key. A section opened in the popup shows the screen's latest saved content because every body renders from the shared query cache and `ExternalValueSyncPlugin` adopts a changed `value` into an unfocused editor [architect_1: `app/src/components/TextEditor/plugins/ExternalValueSyncPlugin.ts` — read]. Verdict C5.

### The Basic Stat Block body renders from its `section` prop and writes through the cache

It no longer looks its section up by id; the caller's `selected` or `transition.from` is the source, so the outgoing slide shows a snapshot. Writes stay `updateSectionContent`, which composes against the cache (the existing comment in the file says why and stays). Verdict C6.

### `EntityPopupBody` is image plus children; `EntityPopupBodyText` is a peer module

`EntityPopupBody` takes `imageId` and optional `children`. `EntityPopupBodyText` (was `EntityPopupBody/components/EntityPopupSummary`) is rendered by the Session and Encounter popups, two unrelated parents, so it sits at `MentionPopupContent/components/`. Verdict C7.

## Sub-feature 1: Shared section bodies

Creates the shared module and replaces the panel's two body components with it. After this sub-feature the panel renders every section through `ContentSectionBody`; the popup is untouched.

### Files affected

Moved:

- `mv app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BasicStatBlockSectionBody/ app/src/components/ContentSectionBody/components/BasicStatBlockSectionBody/` — whole directory (`BasicStatBlockSectionBody.tsx`, `BasicStatBlockSectionBody.css`, `index.ts`, `helper/readSaveableHp.ts`, `helper/__tests__/readSaveableHp.test.ts`); content changes of the `.tsx` and `.css` are listed under Modified. `index.ts` (explicit named export of `BasicStatBlockSectionBody`) and the helper and its test keep their content (the test imports `../readSaveableHp`, which still resolves).

New:

- `app/src/components/ContentSectionBody/index.ts` — `export { ContentSectionBody } from './ContentSectionBody';` (explicit named export; the module hides `components/` and the constants file, so `app/src/CLAUDE.md` — Barrel Files requires the `index.ts`)
- `app/src/components/ContentSectionBody/ContentSectionBody.tsx`
- `app/src/components/ContentSectionBody/ContentSectionBody.css`
- `app/src/components/ContentSectionBody/ContentSectionBody.constants.ts` — `CONTENT_SECTION_EDITOR_PLACEHOLDER = 'Start typing or use / for commands'`, moved from the panel (all three consumers are bodies under this directory, so Constants Trigger 1 puts the file at `ContentSectionBody/`)
- `app/src/components/ContentSectionBody/components/TextSectionBody/TextSectionBody.tsx`
- `app/src/components/ContentSectionBody/components/FiveEStatBlockSectionBody/FiveEStatBlockSectionBody.tsx`

Modified:

- `app/src/components/ContentSectionBody/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.tsx` (after the move)
- `app/src/components/ContentSectionBody/components/BasicStatBlockSectionBody/BasicStatBlockSectionBody.css` (after the move)
- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.tsx`
- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.css`

Deleted:

- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/components/BaseEntityContentSectionBody/BaseEntityContentSectionBody.tsx` and `.css` — replaced by `ContentSectionBody`
- `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.constants.ts` — its only content moves to `ContentSectionBody.constants.ts`; both former importers are rewritten

Test files: `readSaveableHp.test.ts` moves unchanged. Its behaviours: unconvertible text (reported as an empty value) reads as unsaveable, catching a regression that saves a cleared HP while the user is mid-typing `1.`; a deliberately cleared field reads as a saveable empty HP, catching a refusal to clear HP; a decimal the input can convert is rejected, catching a save of a non-whole HP. No new test file: every acceptance criterion this sub-feature touches is decided by rendering and the shared query cache, not by a handler alone (`app/src/CLAUDE.md` — Testing Policy forbids component tests otherwise).

### Frontend

**Prop contracts** (toolchain-checked: [spec-writer_1: ran `npx tsc --noEmit` from `app/` with this block in a scratch file under `app/src/components/ContentSectionBody/` — no errors; `npx eslint` on it reported only `local/no-unused-exports` on the two scratch exports]):

```ts
type SectionBodyProps = {
  section: BaseEntityContentSection; // from '@db/base-entity-content-section'
  baseEntityId: string;
  readOnly: boolean;
};
type ContentSectionBodyProps = SectionBodyProps & HtmlProps<'div'>;
```

`ContentSectionBody` uses `ContentSectionBodyProps` (props case 1: its root is a `div`); the three type bodies use `SectionBodyProps` as `type Props` with `FCProps<Props>`.

**`ContentSectionBody`**

- Purpose: the one place that maps a section type to its body, for the panel and the popup.
- Behavior: switches on `section.type` over `text`, `basic-stat-block` and `5e-stat-block`, exhaustively (no default branch, so adding a fourth type is a type error at the switch). Forwards `section`, `baseEntityId`, `readOnly`. The `basic-stat-block` body is rendered with `key={section.id}` so switching between two stat-block sections remounts it and resets its HP field (keep the existing explanatory comment). The remaining props (`className` and other div attributes) go onto the root `div`, `className` merged with `content-section-body` through `cn` (`@/util/className`).
- UI / Visual: root `div.content-section-body` holding the chosen body; CSS `display: flex`, `max-height: var(--popup-content-section-height)`, `max-width: var(--popup-content-max-width)`, `overflow-y: auto` (the first four lines carried over from `BaseEntityContentSectionBody.css`; its margin is dropped).

**`TextSectionBody` and `FiveEStatBlockSectionBody`** (identical today, kept apart because the 5e body is where its structure lands later; each states why in a one-line comment naming the other)

- Purpose: render a text-like section.
- Behavior: a `TextEditor` with `textEditorId` per the mode rule above, `value={section.content ?? ''}`, `readOnly={readOnly}`. Editable: `placeholder={CONTENT_SECTION_EDITOR_PLACEHOLDER}` and `onChange` calling `updateSection(section.id, { content })` from `useBaseEntityContentSections(baseEntityId)`. Read-only: neither prop is passed (conditional spread, as the old `BaseEntityContentSectionBody` did, because `exactOptionalPropertyTypes` is on). A section with `content === null` shows an empty editor.
- UI / Visual: the editor only, no wrapper.

**`BasicStatBlockSectionBody`** (existing file after the move)

- Purpose: Basic Stat Block layout: HP row, then the text.
- Behavior: props become `SectionBodyProps`; remove `useParams`, the `sectionId` prop, the cache lookup of `section`, the `section === null` early return, and the import of `BaseEntityContentSectionPanel.constants` (import `CONTENT_SECTION_EDITOR_PLACEHOLDER` from `../../ContentSectionBody.constants`). `content` is parsed from `section.content`. All hooks stay called unconditionally. Editable mode is the existing body unchanged (`Input` of type number, `readSaveableHp`, `updateSectionContent`, revision remount, gutter custom property), with the text editor's id `basic-stat-block-<section.id>-edit`. Read-only mode: the HP row shows the `BASIC_STAT_BLOCK_HP_LABEL` span followed by the saved HP as text (`String(hp)`), nothing after the label when `hp` is `null`; the text editor is read-only with id `...-read`, no placeholder, no `onChange`. Removing the lookup is safe because `selected` and `transition.from` come from the same query data and writes never read the rendered section.
- UI / Visual: root `basic-stat-block-section-body` as today. The HP row keeps `display: flex`, `align-items: center`, `gap: var(--spacing-sm)` in the class `basic-stat-block-section-body-hp`; the `padding-left: var(--basic-stat-block-section-body-gutter-width)` moves to a modifier `basic-stat-block-section-body-hp--editable` applied only to the editable `label`; the read-only row is a `div` with the base class and no modifier, and the root's `--basic-stat-block-section-body-gutter-width` custom property is set only in editable mode. The HP row reads the same label style as today (the `label` span class is unchanged).
- [MANUAL-VERIFY] In the browser pane (`pnpm run web`): a Basic Stat Block popup's "HP" label starts at the same left edge as its text, and the row looks like the screen's apart from the input.
- [MANUAL-VERIFY] In the browser pane: a Text section in the popup is not wider or taller than before (the old popup text sat in a block `div`, the new one in a flex container); long text scrolls inside `content-section-body` at the popup height.

**`BaseEntityContentSectionPanel`**

- Purpose: renders sections editable, and the outgoing slide read-only.
- Behavior: imports `ContentSectionBody` from `@/components/ContentSectionBody`; replaces both `BaseEntityContentSectionBody` uses: outgoing `<ContentSectionBody section={transition.from} baseEntityId={baseEntityId} readOnly className='base-entity-content-section-panel-body' />`, current the same with `section={selected}` and `readOnly={false}`. `baseEntityId` is the panel's existing `params.baseEntityId ?? ''` value.
- UI / Visual: `BaseEntityContentSectionPanel.css` gains `.base-entity-content-section-panel-body { margin: var(--spacing-sm); margin-left: 0; }`.

Cleanup of violations found in the Modified files: none found. Modified-file scan (inline sub-components, `return null`/`undefined` in void contexts): `BaseEntityContentSectionPanel.tsx` has none; its `if (loading) return;` is a render guard, not a void context. The moved `BasicStatBlockSectionBody.tsx` loses its `if (section === null) return;`. Dead after this sub-feature: `BaseEntityContentSectionPanel.constants.ts` (deleted above); nothing else.

## Sub-feature 2: Popup without a summary concept

Renders content sections in the mention popup through `ContentSectionBody` and removes every "summary" name from the popup code except the Session's own `session.summary` field.

### Files affected

Moved:

- `mv app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/components/EntityPopupSummary/ app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBodyText/`, then rename `EntityPopupSummary.tsx` to `EntityPopupBodyText.tsx` and `EntityPopupSummary.css` to `EntityPopupBodyText.css` (content changes listed under Modified)

Modified:

- `.../MentionPopupContent/components/EntityPopupBodyText/EntityPopupBodyText.tsx` and `.css`
- `.../MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx` and `EntityPopupBody.css`
- `.../MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx`
- `.../MentionPopupContent/components/SessionPopupContent/SessionPopupContent.tsx`
- `.../MentionPopupContent/components/EncounterPopupContent/EncounterPopupContent.tsx`

(all paths under `app/src/components/MentionPopup/`)

New:

- `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.css`

Deleted:

- `.../BaseEntityPopupContent/helper/readPopupSummary.ts` and `helper/__tests__/readPopupSummary.test.ts` — the section-type dispatch is `ContentSectionBody`; the stat-block parse is `parseBasicStatBlockContent`, which has its own tests in `domain/`
- `.../BaseEntityPopupContent/components/StatBlockHp/StatBlockHp.tsx` and `StatBlockHp.css` — HP is part of the Basic Stat Block body

No test file is added or modified (no handler-decided criterion; `MentionPopup.test.tsx` mocks `../components/MentionPopupContent` and names none of the changed modules). The deleted test's behaviours (stat block split into text and HP, empty HP kept, text section passthrough) now belong to `ContentSectionBody` rendering, which is component rendering and carries no test under `app/src/CLAUDE.md` — Testing Policy.

### Frontend

All paths below are under `app/src/components/MentionPopup/components/MentionPopupContent/components/`.

**`EntityPopupBodyText`**

- Purpose: read-only text body for the Session and Encounter popups.
- Behavior: `type Props = { text: string | null; textEditorId: string }`; renders nothing (`return null` is fine: this is a component, not a void context) for `text === null`; otherwise a `TextEditor` with `value={text}`, `textEditorId`, `readOnly`, no placeholder (the old `'Nothing here yet...'` was never shown). `TextEditor` is imported as `'../../../../../TextEditor'`.
- UI / Visual: root `div.entity-popup-body-text`; CSS is the old `.entity-popup-body--summary` three declarations (`max-height: var(--popup-content-section-height)`, `max-width: var(--popup-content-max-width)`, `overflow-y: auto`) under the new class name.

**`EntityPopupBody`**

- Purpose: layout of image beside content.
- Behavior: `type Props = { imageId: string | null; children?: ReactNode }`; no `SlideTransition`, no `EntityPopupBodyText`. Renders the image frame when `imageId !== null`, then `children`. Drops the `components/` folder (it is empty after the move), so the module is `EntityPopupBody.tsx` + `.css`, no `index.ts`.
- UI / Visual: `PanelBody className='entity-popup-body'` and the image frame as today; `.entity-popup-body--summary-region` is removed from `EntityPopupBody.css` (it moves to `BaseEntityPopupContent.css`).

**`BaseEntityPopupContent`**

- Purpose: base entity popup body — image plus the selected section.
- Behavior: remove `readPopupSummary`, `StatBlockHp` and the `summary` locals. After the loading guard and header slots, render `<MentionPopupHeader {...headerSlots} />` then `EntityPopupBody` with `imageId={baseEntity.image_id}`; when `selected` is not `null` its child is a `SlideTransition` (`className='base-entity-popup-content-region'`, `onEnd={endTransition}`, `slide` null or `{ direction: transition.direction, outgoing: <ContentSectionBody section={transition.from} baseEntityId={entityId} readOnly /> }`) containing `<ContentSectionBody section={selected} baseEntityId={entityId} readOnly />`; with no `selected` there is no child, so the image shows alone. The entity image stays outside the sliding region. The `ContentSectionNav` block is unchanged. Imports `ContentSectionBody` as `'../../../../../ContentSectionBody'`.
- UI / Visual: new `BaseEntityPopupContent.css` with `.base-entity-popup-content-region { flex: 1; }`. A section with no content shows an empty body, as before.

**`SessionPopupContent` and `EncounterPopupContent`**

- Purpose: show `session.summary` / `encounter.description` read-only.
- Behavior: render `<EntityPopupBody imageId={null}><EntityPopupBodyText text={session.summary} textEditorId={`session-popup-${entityId}`} /></EntityPopupBody>`; the Encounter one uses `text={encounter.description ?? null}` and `encounter-popup-${entityId}` (the ids are unchanged). Import `EntityPopupBodyText` from `'../EntityPopupBodyText/EntityPopupBodyText'`.
- UI / Visual: unchanged.

AC11 check for the implementer: a case-insensitive grep for `summary` over `app/src/components/MentionPopup/`, `app/src/components/ContentSectionBody/` and `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/` reports only `session.summary` in `SessionPopupContent.tsx`.

Cleanup: modified-file scan (inline sub-components, `return null`/`undefined` in void contexts) finds none in these files; `SessionPopupContent` and `EncounterPopupContent` use `if (loading || …) return;` as a render guard.

## Sub-feature 3: Feature pages and scaffold

### Files affected

Modified:

- `app/docs/features/basic-stat-block.md` — popup rows and "Where to look" now name the shared body; the Rules row "The stat-block body reads and saves its own section, receiving only the section's id" no longer holds (the body receives the section and the base entity id) and is rewritten with the reason that the popup has no route; "Where to look" lists `ContentSectionBody` with `BasicStatBlockSectionBody` and its `readSaveableHp` helper (moved to `app/src/components/ContentSectionBody/components/BasicStatBlockSectionBody/`), and drops `EntityPopupBody` in favour of `BaseEntityPopupContent`; Tests list keeps `readSaveableHp.test`; the popup HP rows state "read-only, laid out as on the screen" (HP then text, no indent)
- `app/docs/features/section-carousel-mention-click.md` — "summary region" and "no summary" become "section region" and "no content"; the failure line "Deleting the selected basic stat block section leaves its outgoing slide slot empty, because the stat-block body reads its section from the cache" and its Rules row no longer hold (the body renders from the `section` prop) and are both removed; the Rules row on `summarySlide` is restated for `SlideTransition` in `BaseEntityPopupContent`; "Where to look" lists `BaseEntityPopupContent`, `EntityPopupBody`, `EntityPopupBodyText`, `ContentSectionBody`, and the Tests line drops `readPopupSummary.test`

- `app/docs/_product/domain-scaffold.md` — registration step 4 under "Adding a content-section type registers it in" ("A body branch in `BaseEntityContentSectionPanel.tsx` and a popup branch in `BaseEntityPopupContent.tsx`, when the type's body is not the plain text editor") no longer holds: the panel and the popup have no per-type branch; the step becomes "A body component under `app/src/components/ContentSectionBody/components/` and its case in the `section.type` switch of `ContentSectionBody.tsx`, when the type's body is not the plain text editor". The rest of the file was read whole: no other statement concerns the panel's or the popup's per-type rendering (line 48 and the "Needs no change" list name `BaseEntityPopupContent`, which stays a type-agnostic entry point)

Both feature pages are read whole by the implementer before editing; any other sentence naming a removed symbol (`readPopupSummary`, `StatBlockHp`, `EntityPopupSummary`, `summarySlide`) is rewritten in the same pass. markdownlint (`markdown-lint` row) runs on them.

### Frontend

Not applicable: documentation only (UI layer entries do not apply).

## CLAUDE.md impact

- `app/CLAUDE.md` — Domain Glossary: the "Content section" entry lists the types as `text` or `5e-stat-block` and omits `basic-stat-block`, which `app/domain/base-entity-content-sections/contentSectionTypes.ts` lists [spec-writer_2: `grep basic-stat-block app/domain/base-entity-content-sections/contentSectionTypes.ts` — found at line 3]; the entry is stale independent of this change.
- The long-living reference `app/docs/_product/domain-scaffold.md` is edited directly in sub-feature 3, not logged here.
