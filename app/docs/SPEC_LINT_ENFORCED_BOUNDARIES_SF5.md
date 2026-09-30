# Sub-feature 5: Layer-root barrels

Deletes the five layer-root `index.ts` files that hide nothing and rewrites every importer (root Key Architectural Decisions — "A folder has an `index.ts` exactly when it hides something"). `src/data-access-layer/index.ts` and `src/screens/index.ts` stay. Consumers now import the module or file they use, such as `@/components/Header`, `@/components/GlassPanel/GlassPanel`, `@/util/className` or `@/types/fcProps.type`. The same pass extracts the sub-component `ErrorFallback` from `ErrorBoundary.tsx`, a file this sub-feature touches.

## How to rewrite an import

Use the procedure in SF4's "How to rewrite an import", with this sub-feature's five deleted files as the deleted barrels. The layer-root targets that result:

- `@/components` → `@/components/<Module>` when `<Module>/` has an `index.ts` (`AnchoredPopup`, `Backdrop`, `ColorInput`, `ErrorBoundary` (added below), `Header`, `HoloImg`, `MentionPopup`, `SideBarNav`, `SortableList`, `TextEditor`, `UploadImgBtn`). Otherwise `@/components/<Module>/<Module>`. `LightSource` and `PopUpContainer` are default imports from their file.
- `@/hooks` → `@/hooks/useListFilter` and `@/hooks/useTypographicInput` (each has an `index.ts`). Otherwise `@/hooks/<file>` (`useDraggable`, `useFocusNameInputOnArrival`, `useSortable`, `useSyncedInputValue`). `SortState` comes from `@/hooks/useSortable`.
- `@/providers` → `@/providers/DeleteDialogProvider` (has an `index.ts`), `@/providers/AppProviders/AppProviders`, `@/providers/PinnedPopupsProvider/PinnedPopupsProvider`.
- `@/types` → `@/types/htmlProps.type`, `@/types/fcProps.type`, `@/types/fileTypes.type`.
- `@/util` → `@/util/className` (`cn`), `@/util/filePicker`, `@/util/typographicRules` (`TYPOGRAPHIC_RULES`), `@/util/getErrorDisplayInfo` (`getErrorDisplayInfo`, `ErrorDisplayInfo`).

An importer inside `src/components/` that used `@/components` or `./components` gets a relative path instead (root Key Architectural Decisions — "Import specifier form"). `App.tsx`'s `'./components'` becomes `@/components/…`, because a file directly in `src/` always uses `@/`.

## Files affected

Deleted:

- `app/src/components/index.ts` — re-exports every folder in `src/components/`
- `app/src/hooks/index.ts` — re-exports every entry in `src/hooks/`
- `app/src/providers/index.ts` — re-exports every provider module
- `app/src/types/index.ts` — re-exports every non-ambient file in `src/types/`. The ambient `historyState.d.ts` and `vitestMatchers.d.ts` were never re-exported and stay
- `app/src/util/index.ts` — re-exports every file in `src/util/`

New:

- `app/src/components/ErrorBoundary/components/ErrorFallback/ErrorFallback.tsx` — `ErrorFallback` moves here unchanged from `ErrorBoundary.tsx`, as a named export (`export const ErrorFallback: FunctionComponent<FallbackProps> = …`). It imports `import type { FunctionComponent } from 'react'`, `import type { FallbackProps } from 'react-error-boundary'`, `getErrorDisplayInfo` from `'@/util/getErrorDisplayInfo'`, and `ErrorFallbackView` from `'../../../ErrorFallbackView/ErrorFallbackView'`.
- `app/src/components/ErrorBoundary/index.ts` — `export { ErrorBoundary } from './ErrorBoundary';` (the folder now has internals).

Modified — Data Access Layer:

- `app/src/data-access-layer/TanstackQueryClientProvider.tsx` — `@/types`

Modified — Frontend. Each entry lists the specifiers to rewrite; entries with an added note carry a further required change:

- `app/db/image/schema.ts` — `@/types`
- `app/src/App.tsx` — `./components`, `@/providers`. `[DEFERRED-VIOLATION: .claude/rules/src-components.md Sub-component ownership — AppContent in app/src/App.tsx]` `AppContent` is a sub-component used only by `App`, declared in the same file. `App.tsx` sits directly in `src/` with no module folder, so extracting `AppContent` means relocating the application root into a module folder and changing its importer `routes/__root.tsx` (`import { App } from '@/App'`). That is a structural change outside an import-path refactor, so this sub-feature leaves `AppContent` in place
- `app/src/components/ActionContainer/ActionContainer.tsx` — `@/util`, `@/types`
- `app/src/components/AnchoredPopup/AnchoredPopup.tsx` — `@/types`, `@/util`
- `app/src/components/Button/Button.tsx` — `@/types`, `@/util`
- `app/src/components/Checkbox/Checkbox.tsx` — `@/types`, `@/util`
- `app/src/components/ClickableIcon/ClickableIcon.tsx` — `@/types`, `@/util`
- `app/src/components/ColorInput/ColorInput.tsx` — `@/types`
- `app/src/components/DateInput/DateInput.tsx` — `@/util`, `@/types`
- `app/src/components/DeleteDialog/DeleteDialog.tsx` — `@/hooks`, `@/types`
- `app/src/components/ErrorBoundary/ErrorBoundary.tsx` — `@/util`. This file also:
  - loses the `ErrorFallback` declaration, which moves to the new file above, and imports it with `import { ErrorFallback } from './components/ErrorFallback/ErrorFallback'`;
  - drops its `getErrorDisplayInfo`, `ErrorFallbackView` and `FunctionComponent` imports and the `FallbackProps` name, all of which only `ErrorFallback` used, so its `@/util` import disappears rather than being rewritten;
  - drops `export default ErrorBoundary;`, because nothing default-imports it [spec-writer_27: `grep -rn "from '.*ErrorBoundary'" app/src` — found only `components/index.ts` (named `ErrorBoundary`) and `TextEditor.tsx` (`LexicalErrorBoundary`, unrelated)].

  `ErrorFallback` is used only by `ErrorBoundary`, so it belongs in `ErrorBoundary/components/` (`.claude/rules/src-components.md` — Sub-component ownership)
- `app/src/components/ErrorFallbackView/ErrorFallbackView.tsx` — `@/types`
- `app/src/components/GlassPanel/GlassPanel.tsx` — `@/types`, `@/util`
- `app/src/components/Header/Header.tsx` — `@/types`
- `app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx` — `@/types`
- `app/src/components/Header/components/BreadcrumbList/components/BaseEntityCrumb.tsx` — `@/types`
- `app/src/components/Header/components/BreadcrumbList/components/BreadcrumbListEntry.tsx` — `@/types`
- `app/src/components/Header/components/BreadcrumbList/components/BreadcrumbListItem.tsx` — `@/types`, `@/util`
- `app/src/components/Header/components/FwBwNav/FwBwNav.tsx` — `@/types`
- `app/src/components/Header/components/SettingsBtn/SettingsBtn.tsx` — `@/types`
- `app/src/components/Header/components/Updater/Updater.tsx` — `@/components`
- `app/src/components/HoloImg/HoloImg.tsx` — `@/types`, `@/util`
- `app/src/components/HoloImg/components/HoloFX/HoloFX.tsx` — `@/types`, `@/util`
- `app/src/components/HoloImg/components/HoloImgTitle/HoloImgTitle.tsx` — `@/types`, `@/util`
- `app/src/components/HorizontalDivider/HorizontalDivider.tsx` — `@/types`, `@/util`
- `app/src/components/ImageById/ImageById.tsx` — `@/types`, `@/util`
- `app/src/components/ImagePlaceholderFrame/ImagePlaceholderFrame.tsx` — `@/util`
- `app/src/components/Input/Input.tsx` — `@/util`, `@/types`
- `app/src/components/LabeledToggleButton/LabeledToggleButton.tsx` — `@/util`
- `app/src/components/LightSource/LightSource.tsx` — `@/types`, `@/util`
- `app/src/components/LoadingIcon/LoadingIcon.tsx` — `@/types`
- `app/src/components/MentionPopup/MentionPopup.tsx` — `@/util`, `@/hooks`, `@/types`
- `app/src/components/MentionPopup/components/DeletedMentionContent/DeletedMentionContent.tsx` — `@/types`
- `app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx` — `@/types`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx` — `@/types`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EncounterPopupContent/EncounterPopupContent.tsx` — `@/types`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx` — `@/types`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/SessionPopupContent/SessionPopupContent.tsx` — `@/types`
- `app/src/components/MentionPopup/components/MentionPopupHeader/MentionPopupHeader.tsx` — `@/types`, `@/util`
- `app/src/components/MenuOptionRow/MenuOptionRow.tsx` — `@/types`, `@/util`
- `app/src/components/NewItemBtn/NewItemBtn.tsx` — `@/util`, `@/types`
- `app/src/components/PopUpContainer/PopUpContainer.tsx` — `@/types`, `@/util`
- `app/src/components/PopupSurface/PopupSurface.tsx` — `@/types`, `@/util`
- `app/src/components/RouteErrorFallback/RouteErrorFallback.tsx` — `@/util`
- `app/src/components/SearchInput/SearchInput.tsx` — `@/hooks`, `@/types`
- `app/src/components/SideBarNav/SideBarNav.tsx` — `@/types`, `@/util`
- `app/src/components/SideBarNav/components/ScreenNavBtn/ScreenNavBtn.tsx` — `@/types`, `@/util`
- `app/src/components/SortableList/SortableList.tsx` — `@/hooks`, `@/util`
- `app/src/components/SortableList/components/SortableListItem/SortableListItem.tsx` — `@/types`, `@/util`
- `app/src/components/SortableList/components/SortableListItem/components/RowActionsMenu/RowActionsMenu.tsx` — `@/types`
- `app/src/components/SortableList/components/SortingTableHeader/SortingTableHeader.tsx` — `@/util`
- `app/src/components/SyncedInput/SyncedInput.tsx` — `@/types`, `@/hooks`
- `app/src/components/TextEditor/TextEditor.tsx` — `@/types`, `@/util`
- `app/src/components/TextEditor/components/FloatingToolbar/components/BaseBtn/BaseBtn.tsx` — `@/types`, `@/util`
- `app/src/components/TextEditor/components/FloatingToolbar/components/LinkRow/components/LinkBtn/LinkBtn.tsx` — `@/types`
- `app/src/components/TextEditor/components/FloatingToolbar/components/LinkRow/components/LinkInput/LinkInput.tsx` — `@/types`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/HeadingBtn/HeadingBtn.tsx` — `@/types`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/ListBtn/ListBtn.tsx` — `@/types`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/TextFormatBtn/TextFormatBtn.tsx` — `@/types`
- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` — `@/types`, `@/util`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/BlockDragHandlePlugin.tsx` — `@/types`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/BlockDragHandle/BlockDragHandle.tsx` — `@/types`, `@/components`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/BlockDropHighlight/BlockDropHighlight.tsx` — `@/types`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/BlockDropIndicator/BlockDropIndicator.tsx` — `@/types`
- `app/src/components/TextEditor/plugins/ExternalValueSyncPlugin.ts` — `@/types`
- `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/components/MentionOptionList/MentionOptionList.tsx` — `@/types`, `@/util`
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/components/SlashCommandOptionList/SlashCommandOptionList.tsx` — `@/types`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableEdgeHint/TableEdgeHint.tsx` — `@/types`, `@/util`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/TableHandleMenu.tsx` — `@/types`
- `app/src/components/TextEditor/typographicTransformers.ts` — `@/util`
- `app/src/components/UploadImgBtn/UploadImgBtn.tsx` — `@/util`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/ImageViewerDialog.tsx` — `@/types`, `@/util`, `@/providers`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/ImagePreviewFramingOverlay.tsx` — `@/types`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/components/IpfoBgImg.tsx` — `@/types`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImageViewerDialogHeader.tsx` — `@/types`
- `app/src/hooks/useTypographicInput/helper/applyTypographicRuleAtCaret.ts` — `@/util`
- `app/src/main.tsx` — `@/components`
- `app/src/providers/AppProviders/AppProviders.tsx` — `@/types`
- `app/src/providers/DeleteDialogProvider/DeleteDialogProvider.tsx` — `@/types`
- `app/src/providers/PinnedPopupsProvider/PinnedPopupsProvider.tsx` — `@/types`
- `app/src/screens/adventure/AdventureScreen.tsx` — `@/components`
- `app/src/screens/adventure/components/AdventureScreenHeader/AdventureScreenHeader.tsx` — `@/components`
- `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx` — `@/components`, `@/providers`
- `app/src/screens/adventures/AdventuresScreen.tsx` — `@/components`
- `app/src/screens/adventures/components/ToAdventureBtn/ToAdventureBtn.tsx` — `@/types`, `@/components`
- `app/src/screens/base-entities/BaseEntitiesScreen.tsx` — `@/components`, `@/types`
- `app/src/screens/base-entity/BaseEntityScreen.tsx` — `@/components`, `@/types`
- `app/src/screens/base-entity/components/BaseEntitySidebar/BaseEntitySidebar.tsx` — `@/components`, `@/providers`, `@/types`
- `app/src/screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx` — `@/types`
- `app/src/screens/components/ScreensDuplicateBtn/components/BaseEntityDuplicateBtn.tsx` — `@/components`, `@/types`
- `app/src/screens/components/ScreensDuplicateBtn/components/EncounterDuplicateBtn.tsx` — `@/components`, `@/types`
- `app/src/screens/components/ScreensDuplicateBtn/components/SessionDuplicateBtn.tsx` — `@/components`, `@/types`
- `app/src/screens/components/ScreensNameInput/ScreensNameInput.tsx` — `@/types`, `@/components`, `@/hooks`
- `app/src/screens/components/ScreensSidebar/ScreensSidebar.tsx` — `@/types`, `@/util`
- `app/src/screens/components/ScreensSummary/ScreensSummary.tsx` — `@/types`, `@/components`
- `app/src/screens/components/ScreensTextEditorLayout/ScreensTextEditorLayout.tsx` — `@/types`, `@/components`
- `app/src/screens/encounter/EncounterScreen.tsx` — `@/components`
- `app/src/screens/encounter/components/EncounterSidebar.tsx` — `@/components`, `@/providers`
- `app/src/screens/encounters/EncountersScreen.tsx` — `@/components`
- `app/src/screens/session/SessionScreen.tsx` — `@/components`
- `app/src/screens/session/components/InGameView/InGameView.tsx` — `@/components`
- `app/src/screens/session/components/InGameView/components/InGameStepSection/InGameStepSection.tsx` — `@/components`
- `app/src/screens/session/components/InGameView/components/InGameStepSection/components/InGameStepSectionTitle/InGameStepSectionTitle.tsx` — `@/types`
- `app/src/screens/session/components/PrepView/PrepView.tsx` — `@/types`
- `app/src/screens/session/components/PrepView/components/StepSection/StepSection.tsx` — `@/components`, `@/types`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx` — `@/components`, `@/types`, `@/providers`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderMoveBtn/StepSectionHeaderMoveBtn.tsx` — `@/components`, `@/types`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderTitle/StepSectionHeaderTitle.tsx` — `@/components`, `@/types`
- `app/src/screens/session/components/PrepView/components/StepSection/components/TooltipPanel/TooltipPanel.tsx` — `@/types`
- `app/src/screens/session/components/SessionHeader.tsx` — `@/components`, `@/types`, `@/hooks`
- `app/src/screens/session/components/StepsNavSidebar/StepsNavSidebar.tsx` — `@/components`, `@/types`
- `app/src/screens/session/components/StepsNavSidebar/components/DeleteSessionBtn/DeleteSessionBtn.tsx` — `@/components`, `@/providers`
- `app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/SessionStepsNav.tsx` — `@/components`
- `app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/components/SortableStepItem.tsx` — `@/components`, `@/util`
- `app/src/screens/session/components/StepsNavSidebar/components/ToggleSessionViewBtn/ToggleSessionViewBtn.tsx` — `@/components`
- `app/src/screens/sessions/SessionsScreen.tsx` — `@/components`
- `app/src/screens/settings/SettingsScreen.tsx` — `@/components`
- `app/src/screens/settings/components/AppearanceSection/AppearanceSection.tsx` — `@/components`
- `app/src/screens/settings/components/DevicesSection/DevicesSection.tsx` — `@/components`
- `app/src/screens/settings/components/DevicesSection/components/OwnDevice/OwnDevice.tsx` — `@/components`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/PairDeviceDialog.tsx` — `@/components`, `@/types`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/components/PDDCandidatesList/PDDCandidatesList.tsx` — `@/types`, `@/components`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/PairedDevices.tsx` — `@/components`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/DeviceRow/DeviceRow.tsx` — `@/components`, `@/providers`, `@/types`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/DeviceRow/components/StatusIndicator/StatusIndicator.tsx` — `@/types`
- `app/src/screens/settings/components/EnableButton/EnableButton.tsx` — `@/components`, `@/types`, `@/util`
- `app/src/screens/settings/components/H2/H2.tsx` — `@/types`
- `app/src/screens/settings/components/H3/H3.tsx` — `@/types`
- `app/src/screens/settings/components/ListConfigSection/ListConfigSection.tsx` — `@/components`
- `app/src/screens/settings/components/ListConfigSection/components/ListConfigRow/ListConfigRow.tsx` — `@/types`, `@/components`
- `app/src/screens/settings/components/Section/Section.tsx` — `@/types`
- `app/src/util/filePicker.ts` — `@/types`

Moved: none. Draft: none.

## Layered breakdown

### Data Access Layer

`TanstackQueryClientProvider.tsx` — the `@/types` specifier, rewritten as above. `src/data-access-layer/index.ts` stays: it leaves out five files at the layer root.

### Frontend

Work in this order, running `npx tsc --noEmit` from `app/` after each step:

1. Create `ErrorFallback.tsx` and `ErrorBoundary/index.ts`, and trim `ErrorBoundary.tsx`.
2. Rewrite every listed specifier.
3. Delete the five layer-root `index.ts` files.

`src/screens/index.ts` stays, because it leaves out `screens.constants.ts` and `components/`. Routes keep importing `@/screens`.

## Tests

No behavior changes. `ErrorFallback` is a React component, and `app/src/CLAUDE.md` — Testing Policy forbids component tests. `util/getErrorDisplayInfo.ts`, which it calls, keeps its existing tests. No test mocks one of the five deleted files [spec-writer_28: `grep -rnE "vi\.mock\(" app/src` for `'@/components'`, `'@/hooks'`, `'@/providers'`, `'@/types'`, `'@/util'` — not found]. Test files importing through them are listed above and change only their specifiers.

## Verification

- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` and `npx vitest run` pass from `app/`.
- `npx eslint .` prints no `local/no-import-past-index` warning and no `import-x/no-cycle` warning. If `no-cycle` reports a cycle, stop and report it to the user before changing any file: the dependency graph at spec time predicted none after SF3–SF5 (root Key Architectural Decisions — "Cycles are enforced by `import-x/no-cycle`").
- `grep -rnE "from '(@/(components|hooks|providers|types|util)|\./components)'" app/src` returns nothing.
