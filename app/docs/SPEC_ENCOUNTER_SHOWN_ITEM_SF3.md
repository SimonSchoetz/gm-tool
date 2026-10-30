# Sub-feature 3: Promote the content section panel

The entity screen's content section panel moves to `screens/components/` as `ScreensBaseEntityContentSectionPanel` and takes the entity id as a required prop instead of reading it from the route, so the encounter screen can render it for the shown combatant's entity in sub-feature 7. The entity screen is the only consumer in this sub-feature.

## Files affected

Moved:

- `mv app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.tsx app/src/screens/components/ScreensBaseEntityContentSectionPanel/ScreensBaseEntityContentSectionPanel.tsx`, then rename the component, add the prop and rename the CSS classes (below).
- `mv …/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.css app/src/screens/components/ScreensBaseEntityContentSectionPanel/ScreensBaseEntityContentSectionPanel.css`, then rename the three classes.
- `mv …/BaseEntityContentSectionPanel/index.ts app/src/screens/components/ScreensBaseEntityContentSectionPanel/index.ts`, then export `ScreensBaseEntityContentSectionPanel` from `./ScreensBaseEntityContentSectionPanel` as one explicit named export. The folder keeps its `index.ts` because it hides `components/` and `helper/` (`app/src/CLAUDE.md` — Barrel Files).
- `mv …/BaseEntityContentSectionPanel/components/ContentSectionTypeMenu/ContentSectionTypeMenu.tsx` and `ContentSectionTypeMenu.css` to the same relative path under `ScreensBaseEntityContentSectionPanel/`, unchanged.
- `mv …/BaseEntityContentSectionPanel/helper/getIdAfterRemoval.ts` and `helper/__tests__/getIdAfterRemoval.test.ts` to the same relative path under `ScreensBaseEntityContentSectionPanel/`, unchanged.

Modified:

- `app/src/screens/base-entity/BaseEntityScreen.tsx` — import `ScreensBaseEntityContentSectionPanel` from `../components/ScreensBaseEntityContentSectionPanel` and render it with `baseEntityId={baseEntity.id}`; keep `key={baseEntity.id}` and its comment.

No re-export stays at the old path (`app/CLAUDE.md` — TypeScript Coding Style, the moved-file rule). The old folder is empty afterwards and goes. The panel's remaining imports (`@/…` aliases, `./components/ContentSectionTypeMenu/ContentSectionTypeMenu`, `./helper/getIdAfterRemoval`) resolve unchanged from the new folder.

## Frontend

`ScreensBaseEntityContentSectionPanel` — Purpose: the editable content section panel of one base entity, shared by the entity screen and the encounter screen's shown combatant. Behavior (decision: "The content section panel is promoted and takes the entity id as a required prop" in the root Key Architectural Decisions): unchanged, except that the id comes in as a prop [spec-writer_25: ran `npx tsc --noEmit` from `app/` with this type and an `FCProps<Props>` component in a scratch module in `app/src/screens/components/` — exit 0; `npx eslint` on it reported only `local/no-unused-exports`]:

```ts
type Props = { baseEntityId: string };
```

- Drop the `useParams` import and call. Type the component `FCProps<Props>` (closed API, case 3 of the props pattern in `.claude/rules/src-components.md`). Every former use of the route-derived `baseEntityId` reads the prop. The component keeps calling `useBaseEntityContentSections(baseEntityId)` itself; a fallback to the route is not kept, because both consumers pass the id.
- UI / Visual: the root `GlassPanel` and its children are unchanged. Rename the three class names to the new block: `base-entity-content-section-panel` becomes `screens-base-entity-content-section-panel`, `base-entity-content-section-panel-name-input` becomes `screens-base-entity-content-section-panel-name-input`, and `base-entity-content-section-panel-body` becomes `screens-base-entity-content-section-panel-body` (four `className` uses in the `.tsx`, three selectors in the `.css`). Class names derived from the former parent name are a violation (`app/src/CLAUDE.md` — Styles). No other file references them [spec-writer_14: `grep -rn "base-entity-content-section-panel" app/src` outside the folder — not found].

[MANUAL-VERIFY] Open any entity in web mode (`pnpm run web`) and select a Text section. The section name field reads the section's name in the panel's title type size and weight, and the body sits inside the panel with a small margin on its top, right and bottom and none on its left. A missed class rename drops those styles silently, and jsdom computes no style. (Reasoned from the stylesheet, not run.)

Stylesheet reach: on the entity screen the panel keeps the same layout slot (`.screens-text-editor-layout--body`, unchanged) and its own renamed stylesheet, so no element's appearance changes.

## Tests — behaviours and the defect each catches

- `getIdAfterRemoval.test.ts` (moved, unchanged): the id directly below a removed id is chosen, the id above for the last one, and null for the only id or an unknown id (catches the wrong section selected after a delete).

## Verification step

After the check rows pass and before the commit, run `pnpm run mutation-check -- app/src/screens/components/ScreensBaseEntityContentSectionPanel/helper/getIdAfterRemoval.ts` and resolve every survivor; the moved file has its own test file.
