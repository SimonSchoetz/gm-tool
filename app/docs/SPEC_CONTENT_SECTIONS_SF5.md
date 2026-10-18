# Sub-feature 5: Mention popup content sections

A base entity's mention popup shows the entity's top content section, labels itself `"[entity name] | [section name]"`, and — when the entity has more than one section — offers the burger nav to switch and reorder sections, read-only and without creating, renaming or deleting. The popup header reads the shell's pin, close, navigate and drag behavior from a context, so the base-entity content can render it (Key Architectural Decisions — The popup header reads its shell behavior from `MentionPopupHeaderContext`). Commit type: `feat`.

| Sections | Header | Body |
| --- | --- | --- |
| 0 | `[entity name]` | image only, as today |
| 1 | `[entity name] \| [section name]` | image and the section, read-only |
| more than 1 | burger, `[entity name] \| [section name]` | image and the shown section, or the nav while it is open |

## Files affected

- `Modified:`
  - `app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts` — remove `summarySection`, now unread
  - `app/src/components/MentionPopup/MentionPopup.tsx` — provide `MentionPopupHeaderContext`; the header renders inside the content and the error fallback
  - `app/src/components/MentionPopup/components/MentionPopupHeader/MentionPopupHeader.tsx` — read the context; take only the slots as props
  - `app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx` — render the header for non-base types
  - `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx` — shown section, burger, nav and header slots
- `Deleted:` none
- `New:`
  - `app/src/components/MentionPopup/MentionPopupHeaderContext.ts`
  - `app/src/components/MentionPopup/hooks/useMentionPopupHeader.ts`
- `Moved:` none
- `Draft:` none

`app/src/components/MentionPopup/index.ts` needs no change: it exports `MentionPopup` and the `PopupPosition`/`PopupPlacement` types by name, explicit named exports as `app/CLAUDE.md` — Directory Structure requires, and the new context stays internal to the module. `MentionPopupHeader.css` keeps its `mention-popup-name--pinned` rules unchanged. `EntityPopupBody` keeps its API.

## Data Access Layer

### `useBaseEntityContentSections.ts` — Modified

Remove `summarySection` from `UseBaseEntityContentSectionsReturn`, its `const summarySection = …` derivation and its entry in the returned object. Its two readers, `BaseEntitySummary` (gone in Sub-feature 4) and `BaseEntityPopupContent` (rewritten below), no longer read it; nothing else does [spec-writer_1: grep -rn "summarySection" app/src app/services app/domain app/db — found only BaseEntitySummary.tsx, BaseEntityPopupContent.tsx and useBaseEntityContentSections.ts — as of d2221f96]. `__tests__/useBaseEntityContentSections.test.ts` never reads it, so no assertion goes stale.

## Frontend

### `MentionPopupHeaderContext` — `app/src/components/MentionPopup/MentionPopupHeaderContext.ts` — New

This is the first React context under `src/components/`; every part of it is stated here because no existing instance is a pattern for it.

- **Placement:** the `MentionPopup` module's own folder, beside `MentionPopup.tsx`. It is a neutral file both its provider and its reader import, so `MentionPopupHeader` never imports from the module's main component file (`.claude/rules/src-components.md` — Component Library, the type-back-from-parent rule).
- **Exports:**
  - `type MentionPopupHeaderContextValue = { name: string; isPinned: boolean; draggableProps: ReturnType<typeof useDraggable>['draggableProps']; onPin: () => void; onRemove: () => void; onNavigate: () => void; };` — `useDraggable` comes from a type-only import, `import type { useDraggable } from '@/hooks/useDraggable';`. The type is module-private: the reader hook below infers it, so nothing imports it.
  - `export const MentionPopupHeaderContext = createContext<MentionPopupHeaderContextValue | null>(null);` — `createContext` requires a default value (`.claude/knowledge/react.md`).
- **Reader hook:** `app/src/components/MentionPopup/hooks/useMentionPopupHeader.ts` exports `useMentionPopupHeader`, which reads the context and throws `useMentionPopupHeader must be called within a MentionPopup` when it is `null` — the shape of `useDeleteDialog` and `usePinnedPopups`. It sits in the module's own `hooks/` function-grouping folder, so that folder has no `index.ts`, and it has no unit test (neither existing reader hook has one). It returns the value with an inferred type.
- **Who imports it:** `MentionPopup.tsx` imports the context to provide it, and `useMentionPopupHeader.ts` imports it to read it; `MentionPopupHeader.tsx` reads it only through the hook. It is not exported from `MentionPopup/index.ts`, and nothing outside `app/src/components/MentionPopup/` imports it.
- **Value:** only what `MentionPopupHeader` reads (`.claude/rules/src-providers.md` — "Context value types contain only what external consumers call through the hook").

### `MentionPopup.tsx` — Modified

- **Purpose:** unchanged — the positioned, pinnable, draggable shell of every mention popup.
- **Behavior:** the non-deleted branch becomes:
  - `<MentionPopupHeaderContext.Provider value={{ name, isPinned, draggableProps, onPin: handlePin, onRemove, onNavigate: handleNavigate }}>` wrapping
  - `<ErrorBoundary fallback={<><MentionPopupHeader /><DeletedMentionContent entityType={entityType} /></>}>` wrapping
  - `<MentionPopupContent entityId={entityId} entityType={entityType} adventureId={adventureId} />`
  - The direct `<MentionPopupHeader … />` render with its six props goes away; `MentionPopupContent` and the fallback render the header now, so a popup whose content throws still has its close and pin controls. The `deleted` branch (`<DeletedMentionContent />` alone) is unchanged.
- **UI / Visual:** unchanged. The provider and the boundary render no DOM, so the header and the body stay direct children of the `mention-popup` `GlassPanel`, whose `gap` separates them.

### `MentionPopupHeader.tsx` — Modified

- **Purpose:** unchanged — the menu bar of every mention popup: name, pin/close, navigate and drag.
- **UI / Visual:** unchanged, apart from an optional element left of the name and an optional suffix after it.
- **Props** (case 3, `FCProps<Props>`): `leading?: ReactNode` (defaulting to `null` in the destructuring, so an omitted prop and an explicit `null` both mean "no leading element"), `titleSuffix?: string`. The six behavior props and the local `DraggableProps` type go away; the type now comes from `useDraggable`'s return type in the context file instead of a hand-copied duplicate.
- **Behavior:** `const header = useMentionPopupHeader();`. Then render as today from `header`'s fields, with three changes:
  - the title is `<>{header.isPinned && leading === null && <>⠿</>} {header.name}{titleSuffix}</>` — the ⠿ glyph shows only when pinned and no `leading` element is given
  - `PanelMenuBar` receives `leading={leading}` (Sub-feature 4)
  - `titleProps` still spread the drag handlers when pinned, so a pinned popup with a burger is dragged by its title
- **Imports:** the `ReactNode` type from `react` replaces the default `React` import, which only the removed `DraggableProps` type used; `useMentionPopupHeader` from `'../../hooks/useMentionPopupHeader'`.

### `MentionPopupContent.tsx` — Modified

- **Purpose:** unchanged — picks the popup body for the mention's type.
- **UI / Visual:** unchanged — the header still sits above the body.
- **Behavior:**
- Import `MentionPopupHeader` from `'../MentionPopupHeader/MentionPopupHeader'`.
- Base entity types: unchanged — `BaseEntityPopupContent` renders its own header.
- `if (!PopupContent) return;` → `if (!PopupContent) return <MentionPopupHeader />;`, so an unmapped type still shows the header it showed before.
- `return <PopupContent … />;` → `return (<><MentionPopupHeader /><PopupContent entityId={entityId} adventureId={adventureId} /></>);`. `SessionPopupContent` and `EncounterPopupContent` stay unchanged and keep rendering nothing while loading, under a header that is already visible.

### `BaseEntityPopupContent.tsx` — Modified

- **Purpose:** a base entity's popup header and body, now aware of content sections.
- **Props:** unchanged (`entityType`, `entityId`, `adventureId`).
- **Behavior:**
  - Hooks, all before any return: `useBaseEntity(entityType, entityId, adventureId ?? '')` → `baseEntity`, `loading`; `useBaseEntityContentSections(entityId)` → `sections`, `loading: sectionsLoading`; `useListNavigation(sections)` (Sub-feature 4) → `selected`, `isNavAvailable`, `isNavVisible`, `select`, `toggleNav`.
  - While `loading || sectionsLoading || !baseEntity`: `return <MentionPopupHeader />;`.
  - Header slots — `const headerSlots: React.ComponentProps<typeof MentionPopupHeader>` is `{}` when `selected` is `null`, else ``{ titleSuffix: ` | ${selected.name ?? ''}`, leading: isNavAvailable ? <ContentSectionNavToggle isOpen={isNavVisible} onToggle={toggleNav} /> : null }``. `null` means no leading element; `titleSuffix` is only ever a string. Render `<MentionPopupHeader {...headerSlots} />`.
  - Body: while `isNavVisible`, `<ContentSectionNav baseEntityId={entityId} activeId={selected?.id ?? null} onSelect={select} newItem={null} newItemRef={null} />` (no new-item button in the popup). Comment, as a `//` line directly above it inside the conditional expression (it is an operand there, not a JSX child, so the braced form does not apply): `Rendered inline in place of EntityPopupBody, never through AnchoredPopup's portal: an unpinned MentionPopup removes itself on mouse leave.` Otherwise `<EntityPopupBody summary={selected?.content ?? null} imageId={baseEntity.image_id} textEditorId={…} />`, where `textEditorId` is ``selected ? `content-section-popup-${selected.id}` : `${entityType}-popup-${entityId}` `` — the section id remounts the read-only editor on a switch, as on the screen, and the fallback is today's value. Comment, as a `//` line directly above the `textEditorId` attribute (a `{/* … */}` comment between attributes does not compile, `.claude/knowledge/typescript.md`): `The section id makes EntityPopupBody's TextEditor remount on a section switch instead of showing the previous section.` A section whose content is `null` shows the image only, as a `null` summary does today.
- **Imports:** `MentionPopupHeader` from `'../../../MentionPopupHeader/MentionPopupHeader'`; `ContentSectionNav` from `'../../../../../ContentSectionNav/ContentSectionNav'` and `ContentSectionNavToggle` from `'../../../../../ContentSectionNavToggle/ContentSectionNavToggle'` (same direct child of `src/`, so relative, as `EntityPopupBody.tsx` imports `'../../../../../ImageById/ImageById'` from the same depth); `useListNavigation` from `@/hooks/useListNavigation`.
- **UI / Visual:** the header and one body element, no new stylesheet — the nav's own `content-section-nav` class caps its height at `--summary-content-height`, the height the popup body already uses.

## Verification

Run the full suite of root `CLAUDE.md` — Tool Use Discipline from `app/` after this last sub-feature: `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`, `npx vitest run`.

Human-tester hand-off (`pnpm run dev` only):

- An entity with no sections: the popup shows its name and image as before.
- With one section: `Name | Section` and the section's text, no burger.
- With several sections: a burger left of the name on a hover popup and on a pinned one. On the pinned popup the ⠿ is gone, and dragging the title still moves the popup. The burger opens the nav in place of the body with the current section highlighted. Clicking an item shows it in that popup only. Dragging an item reorders it, and the entity screen's order follows.
- A cleared section name shows `Name | `.
- Pin and close still work. A popup for a session or an encounter looks and behaves as before.
