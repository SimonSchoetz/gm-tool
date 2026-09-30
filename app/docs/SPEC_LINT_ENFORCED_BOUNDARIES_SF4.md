# Sub-feature 4: Module barrels

Below the layer roots of `app/src/`, this deletes every `index.ts` that hides nothing and adds one to every module folder that has internals but no `index.ts`. It then rewrites every import that went through a deleted file. The rules deciding each file are in root Key Architectural Decisions — "A folder has an `index.ts` exactly when it hides something". The form of every rewritten specifier is in "Import specifier form".

The five layer-root barrels (`src/components/index.ts`, `src/hooks/index.ts`, `src/providers/index.ts`, `src/types/index.ts`, `src/util/index.ts`) stay in this sub-feature and are deleted in SF5. Where one of them re-exports from a file deleted here, only that re-export line changes.

## How to rewrite an import

For each import, re-export or `vi.mock` specifier listed under `Modified:`, and for each symbol it names, find the file that declares the symbol by following the deleted barrel's own re-export line. Then apply root Key Architectural Decisions — "Import specifier form":

- The target is the `index.ts` of the last folder with an `index.ts` (after this sub-feature's additions and deletions) passed while walking from the declaring file's folder toward the importer, before reaching a folder that contains the importer. When no folder on that walk has one, the target is the declaring file itself.
- One statement that named several symbols becomes one statement per distinct target. Keep `type` modifiers and local names as they were.

`npx tsc --noEmit` reports every importer the list below misses, because a deleted `index.ts` leaves its specifier unresolvable. `local/no-import-past-index` reports every rewritten specifier that points past a boundary.

Examples:

- `import { partitionPinnedItems } from './helper'` in `components/SortableList/SortableList.tsx` becomes `from './helper/partitionPinnedItems'`.
- `import { SortableListItem, SortingTableHeader } from './components'` in the same file becomes two statements: `SortableListItem` from `'./components/SortableListItem'`, because that folder keeps its `index.ts`, and `SortingTableHeader` from `'./components/SortingTableHeader/SortingTableHeader'`, because that folder loses its `index.ts`.
- `import { StepSection } from './components'` in `screens/session/components/PrepView/PrepView.tsx` becomes `from './components/StepSection'`, because `StepSection/` keeps its `index.ts`.

## Files affected

Deleted — each `index.ts` below is either in a function-grouping folder (`helper`, `components`, `hooks`, `nodes`, `plugins`, `types` inside a module) or in a module folder that holds one source file and at most its stylesheet and `__tests__/` [spec-writer_25: ran a disposable folder classifier over `app/src` at 245a4168 — observed 63 function-grouping `index.ts` files and 14 single-file module `index.ts` files]:

- `app/src/components/AnchoredPopup/helper/index.ts`
- `app/src/components/Backdrop/helper/index.ts`
- `app/src/components/Backdrop/types/index.ts`
- `app/src/components/ClickableIcon/index.ts`
- `app/src/components/ColorInput/helper/index.ts`
- `app/src/components/Header/components/BreadcrumbList/components/index.ts`
- `app/src/components/Header/components/index.ts`
- `app/src/components/Header/helper/index.ts`
- `app/src/components/HoloImg/components/index.ts`
- `app/src/components/HoloImg/hooks/index.ts`
- `app/src/components/HorizontalDivider/index.ts`
- `app/src/components/LoadingIcon/index.ts`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/index.ts`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/index.ts`
- `app/src/components/MentionPopup/components/index.ts`
- `app/src/components/MenuOptionRow/index.ts`
- `app/src/components/PopupSurface/index.ts`
- `app/src/components/SideBarNav/components/index.ts`
- `app/src/components/SortableList/components/SortableListItem/components/index.ts`
- `app/src/components/SortableList/components/SortableListItem/helper/index.ts`
- `app/src/components/SortableList/components/SortingTableHeader/index.ts`
- `app/src/components/SortableList/components/index.ts`
- `app/src/components/SortableList/helper/index.ts`
- `app/src/components/TextEditor/components/FloatingToolbar/components/LinkRow/components/index.ts`
- `app/src/components/TextEditor/components/FloatingToolbar/components/LinkRow/helper/index.ts`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/index.ts`
- `app/src/components/TextEditor/components/FloatingToolbar/components/index.ts`
- `app/src/components/TextEditor/components/MentionBadge/helper/index.ts`
- `app/src/components/TextEditor/components/index.ts`
- `app/src/components/TextEditor/helper/index.ts`
- `app/src/components/TextEditor/nodes/index.ts`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/components/index.ts`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/helper/index.ts`
- `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/components/index.ts`
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/components/index.ts`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableEdgeHint/helper/index.ts`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/helper/index.ts`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/index.ts`
- `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/helper/index.ts`
- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/helper/index.ts`
- `app/src/components/TextEditor/plugins/index.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/components/index.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/helper/index.ts`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/index.ts`
- `app/src/components/UploadImgBtn/components/index.ts`
- `app/src/data-access-layer/pinned-order/index.ts`
- `app/src/hooks/useListFilter/helper/index.ts`
- `app/src/hooks/useTypographicInput/helper/index.ts`
- `app/src/providers/AppProviders/index.ts`
- `app/src/screens/adventure/components/AdventureScreenHeader/components/index.ts`
- `app/src/screens/adventure/components/index.ts`
- `app/src/screens/adventures/components/index.ts`
- `app/src/screens/base-entity/components/index.ts`
- `app/src/screens/components/ScreensDuplicateBtn/components/index.ts`
- `app/src/screens/components/index.ts`
- `app/src/screens/encounter/components/index.ts`
- `app/src/screens/session/components/InGameView/components/InGameStepSection/components/index.ts`
- `app/src/screens/session/components/InGameView/components/index.ts`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderMoveBtn/index.ts`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderTitle/index.ts`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/index.ts`
- `app/src/screens/session/components/PrepView/components/StepSection/components/TooltipPanel/index.ts`
- `app/src/screens/session/components/PrepView/components/StepSection/components/index.ts`
- `app/src/screens/session/components/PrepView/components/index.ts`
- `app/src/screens/session/components/StepsNavSidebar/components/DeleteSessionBtn/index.ts`
- `app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/components/index.ts`
- `app/src/screens/session/components/StepsNavSidebar/components/ToggleSessionViewBtn/index.ts`
- `app/src/screens/session/components/StepsNavSidebar/components/index.ts`
- `app/src/screens/session/components/index.ts`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/components/index.ts`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/DeviceRow/components/index.ts`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/DeviceRow/helper/index.ts`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/index.ts`
- `app/src/screens/settings/components/DevicesSection/components/index.ts`
- `app/src/screens/settings/components/DevicesSection/helper/index.ts`
- `app/src/screens/settings/components/ListConfigSection/components/index.ts`
- `app/src/screens/settings/components/index.ts`

New — one `index.ts` per module folder that holds more than one source file (or a subfolder) but has no `index.ts`. Each re-exports exactly the one symbol that files outside the folder import, which is the folder's main component [spec-writer_26: ran a disposable export-tracing script over `app/src` at 245a4168, following every import through the barrels deleted here — observed exactly one externally imported symbol per folder, each a named export of the folder's main file]:

- `app/src/components/Header/index.ts` — `export { Header } from './Header';`
- `app/src/components/HoloImg/index.ts` — `export { HoloImg } from './HoloImg';`
- `app/src/components/MentionPopup/components/MentionPopupContent/index.ts` — `export { MentionPopupContent } from './MentionPopupContent';`
- `app/src/components/SideBarNav/index.ts` — `export { SideBarNav } from './SideBarNav';`
- `app/src/components/TextEditor/index.ts` — `export { TextEditor } from './TextEditor';`
- `app/src/components/TextEditor/components/FloatingToolbar/components/LinkRow/index.ts` — `export { LinkRow } from './LinkRow';`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/index.ts` — `export { TextFormattingRow } from './TextFormattingRow';`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/index.ts` — `export { BlockDragHandlePlugin } from './BlockDragHandlePlugin';`
- `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/index.ts` — `export { MentionTypeaheadPlugin } from './MentionTypeaheadPlugin';`
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/index.ts` — `export { SlashCommandPlugin } from './SlashCommandPlugin';`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/index.ts` — `export { TableEdgeHandlePlugin } from './TableEdgeHandlePlugin';`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/index.ts` — `export { TableHandleMenu } from './TableHandleMenu';`
- `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/index.ts` — `export { ToggleHeaderGuardPlugin } from './ToggleHeaderGuardPlugin';`
- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/index.ts` — `export { ToggleKeyboardPlugin } from './ToggleKeyboardPlugin';`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/index.ts` — `export { ImageViewerDialog } from './ImageViewerDialog';`
- `app/src/screens/adventure/index.ts` — `export { AdventureScreen } from './AdventureScreen';`
- `app/src/screens/adventure/components/AdventureScreenHeader/index.ts` — `export { AdventureScreenHeader } from './AdventureScreenHeader';`
- `app/src/screens/adventures/index.ts` — `export { AdventuresScreen } from './AdventuresScreen';`
- `app/src/screens/base-entity/index.ts` — `export { BaseEntityScreen } from './BaseEntityScreen';`
- `app/src/screens/encounter/index.ts` — `export { EncounterScreen } from './EncounterScreen';`
- `app/src/screens/session/index.ts` — `export { SessionScreen } from './SessionScreen';`
- `app/src/screens/session/components/InGameView/components/InGameStepSection/index.ts` — `export { InGameStepSection } from './InGameStepSection';`
- `app/src/screens/settings/index.ts` — `export { SettingsScreen } from './SettingsScreen';`
- `app/src/screens/settings/components/DevicesSection/index.ts` — `export { DevicesSection } from './DevicesSection';`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/index.ts` — `export { PairDeviceDialog } from './PairDeviceDialog';`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/index.ts` — `export { PairedDevices } from './PairedDevices';`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/DeviceRow/index.ts` — `export { DeviceRow } from './DeviceRow';`
- `app/src/screens/settings/components/ListConfigSection/index.ts` — `export { ListConfigSection } from './ListConfigSection';`

Modified — Data Access Layer:

- `app/src/data-access-layer/index.ts` — `./pinned-order` becomes `./pinned-order/useSetPinnedOrder` (the folder holds only `useSetPinnedOrder.ts`)

Modified — Frontend. Each entry lists the specifiers to rewrite under "How to rewrite an import"; entries with an added note carry a further required change:

- `app/src/components/AnchoredPopup/AnchoredPopup.tsx` — `./helper`
- `app/src/components/Backdrop/Backdrop.tsx` — `./helper`, `./types`
- `app/src/components/Backdrop/helper/__tests__/generateZigzagPath.test.ts` — `../../types`
- `app/src/components/Backdrop/helper/__tests__/setGridDimensions.test.ts` — `../../types`
- `app/src/components/Backdrop/helper/__tests__/spawnBeam.test.ts` — `../../types`
- `app/src/components/Backdrop/helper/__tests__/tickBeams.test.ts` — `../../types`
- `app/src/components/Backdrop/helper/generateZigzagPath.ts` — `../types`
- `app/src/components/Backdrop/helper/setGridDimensions.ts` — `../types`
- `app/src/components/Backdrop/helper/spawnBeam.ts` — `../types`
- `app/src/components/Backdrop/helper/tickBeams.ts` — `../types`
- `app/src/components/ColorInput/ColorInput.tsx` — `./helper`
- `app/src/components/DateInput/DateInput.tsx` — `../ClickableIcon`
- `app/src/components/Header/Header.tsx` — `./components`
- `app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx` — `../../helper`, `./components`
- `app/src/components/Header/components/BreadcrumbList/components/BreadcrumbListEntry.tsx` — `../../../helper`
- `app/src/components/Header/components/FwBwNav/FwBwNav.tsx` — `@/components/ClickableIcon`
- `app/src/components/HoloImg/HoloImg.tsx` — `./hooks`, `./components`
- `app/src/components/HoloImg/components/HoloFX/HoloFX.tsx` — `../../hooks`
- `app/src/components/HoloImg/components/HoloImgTitle/HoloImgTitle.tsx` — `../../hooks`
- `app/src/components/MentionPopup/MentionPopup.tsx` — `./components`
- `app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx` — `./components`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/BaseEntityPopupContent/BaseEntityPopupContent.tsx` — `../EntityPopupBody`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EncounterPopupContent/EncounterPopupContent.tsx` — `../EntityPopupBody`
- `app/src/components/MentionPopup/components/MentionPopupContent/components/SessionPopupContent/SessionPopupContent.tsx` — `../EntityPopupBody`
- `app/src/components/MentionPopup/components/MentionPopupHeader/MentionPopupHeader.tsx` — `../../../ClickableIcon`
- `app/src/components/SearchInput/SearchInput.tsx` — `../ClickableIcon`
- `app/src/components/SideBarNav/SideBarNav.tsx` — `./components`
- `app/src/components/SortableList/SortableList.tsx` — `../HorizontalDivider`, `./components`, `./helper`
- `app/src/components/SortableList/components/SortableListItem/SortableListItem.tsx` — `../../helper`, `./helper`, `./components`
- `app/src/components/SortableList/components/SortableListItem/components/RowActionsMenu/RowActionsMenu.tsx` — `../../../../../PopupSurface`, `../../../../../MenuOptionRow`, `../../../../../ClickableIcon`
- `app/src/components/SortableList/components/SortableListItem/helper/__tests__/renderCell.test.tsx` — `../../components`. This is the `vi.mock` specifier. It becomes `'../../components/AvatarCell/AvatarCell'`, the file `renderCell.tsx` imports `AvatarCell` from after its own rewrite. A mock resolves by file (`.claude/knowledge/vitest.md` — `## A test file's \`vi.mock\` overrides…`), so leaving the old specifier would leave the real `AvatarCell` rendered and fail the `avatar-cell` assertions
- `app/src/components/SortableList/components/SortableListItem/helper/renderCell.tsx` — `../components`
- `app/src/components/SortableList/components/SortingTableHeader/SortingTableHeader.tsx` — `../../helper`
- `app/src/components/TextEditor/TextEditor.tsx` — `./nodes`, `./components`, `./plugins`, `./helper`
- `app/src/components/TextEditor/components/FloatingToolbar/FloatingToolbar.tsx` — `./components`, `../../helper`
- `app/src/components/TextEditor/components/FloatingToolbar/components/LinkRow/LinkRow.tsx` — `./components`, `./helper`
- `app/src/components/TextEditor/components/FloatingToolbar/components/LinkRow/components/LinkInput/LinkInput.tsx` — `../../../../../../../ClickableIcon`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/TextFormattingRow.tsx` — `./components`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/HeadingBtn/HeadingBtn.tsx` — `../../../../../../helper`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/ListBtn/ListBtn.tsx` — `../../../../../../nodes`, `../../../../../../helper`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/components/TextFormatBtn/TextFormatBtn.tsx` — `../../../../../../nodes`
- `app/src/components/TextEditor/components/FloatingToolbar/components/TextFormattingRow/textFormattingConfig.ts` — `./components`
- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` — `./helper`
- `app/src/components/TextEditor/nodes/MentionNode.tsx` — `../components`
- `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/BlockDragHandlePlugin.tsx` — `./components`, `./helper`
- `app/src/components/TextEditor/plugins/EmbeddedLinkPlugin/EmbeddedLinkPlugin.tsx` — `../../../ClickableIcon`
- `app/src/components/TextEditor/plugins/ExternalValueSyncPlugin.ts` — `../helper`
- `app/src/components/TextEditor/plugins/MentionFormatPlugin/MentionFormatPlugin.tsx` — `../../nodes`
- `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx` — `../../nodes`, `../../helper`, `./components`. Cleanup: in `onQueryChange`, `return null;` after `setOptions([])` becomes `return;`. The callback returns nothing on its other path, so the `null` is a value returned in a void context (`app/CLAUDE.md` — TypeScript Coding Style: "use a bare `return;` for early exits"; found by `app/docs/CLAUDE.md` — Modified-file scan item (2))
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.tsx` — `../../../PopupSurface`, `../../helper`, `./components`
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/components/SlashCommandOptionList/SlashCommandOptionList.tsx` — `../../../../../MenuOptionRow`
- `app/src/components/TextEditor/plugins/SlashCommandPlugin/slashCommandOptions.ts` — `../../nodes`, `../../helper`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/TableEdgeHandlePlugin.tsx` — `../../../PopupSurface`, `./components`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableEdgeHint/TableEdgeHint.tsx` — `./helper`
- `app/src/components/TextEditor/plugins/TableEdgeHandlePlugin/components/TableHandleMenu/TableHandleMenu.tsx` — `./helper`, `../../../../../MenuOptionRow`
- `app/src/components/TextEditor/plugins/ToggleGutterPlugin/ToggleGutterPlugin.ts` — `../../nodes`
- `app/src/components/TextEditor/plugins/ToggleHeaderGuardPlugin/ToggleHeaderGuardPlugin.ts` — `../../nodes`, `./helper`
- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/ToggleKeyboardPlugin.ts` — `../../nodes`, `../../helper`, `./helper`
- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/helper/__tests__/resolveHeaderToggleForRemoval.test.ts` — `../../../../nodes`
- `app/src/components/TextEditor/plugins/ToggleKeyboardPlugin/helper/resolveHeaderToggleForRemoval.ts` — `../../../nodes`, `../../../helper`
- `app/src/components/UploadImgBtn/UploadImgBtn.tsx` — `./components`, `../LoadingIcon`, and also `'../HoloImg/HoloImg'`, which becomes `'../HoloImg'` (`HoloImg/` gains an `index.ts` above). Cleanup: both `return null;` statements in `handleClick` (the `isLoading` guard and the `filePath === null` branch) become `return;`. `handleClick` returns nothing on its other paths, so the `null` is a value returned in a void context (`app/CLAUDE.md` — TypeScript Coding Style: "use a bare `return;` for early exits"; found by `app/docs/CLAUDE.md` — Modified-file scan item (2))
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/ImageViewerDialog.tsx` — `./components`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/ImagePreviewFramingOverlay.tsx` — `./helper`, `./components`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/components/IpfoBgImg.tsx` — `../helper`
- `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImageViewerDialogHeader.tsx` — `../../../../ClickableIcon`
- `app/src/components/index.ts` — `./HorizontalDivider`, `./ClickableIcon`, `./LoadingIcon`, `./PopupSurface`, `./MenuOptionRow`. Only these lines change: SF5 deletes the file. Its `./Header/Header.tsx`, `./HoloImg/HoloImg.tsx`, `./SideBarNav/SideBarNav.tsx` and `./TextEditor/TextEditor.tsx` lines now point past the new `index.ts` files and produce `local/no-import-past-index` warnings until SF5
- `app/src/hooks/useListFilter/useListFilter.ts` — `./helper`
- `app/src/hooks/useTypographicInput/useTypographicInput.ts` — `./helper`
- `app/src/providers/index.ts` — `./AppProviders`
- `app/src/screens/adventure/AdventureScreen.tsx` — `./components`, `../components`
- `app/src/screens/adventure/components/AdventureScreenHeader/AdventureScreenHeader.tsx` — `./components`
- `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx` — `../../../components`
- `app/src/screens/adventures/AdventuresScreen.tsx` — `./components`
- `app/src/screens/base-entity/BaseEntityScreen.tsx` — `./components`, `../components`
- `app/src/screens/base-entity/components/BaseEntitySidebar/BaseEntitySidebar.tsx` — `../../../components`
- `app/src/screens/components/ScreensDuplicateBtn/ScreensDuplicateBtn.tsx` — `./components`
- `app/src/screens/encounter/EncounterScreen.tsx` — `./components`
- `app/src/screens/encounter/components/EncounterHeader.tsx` — `../../components`
- `app/src/screens/encounter/components/EncounterSidebar.tsx` — `../../components`
- `app/src/screens/session/SessionScreen.tsx` — `./components`
- `app/src/screens/session/components/InGameView/InGameView.tsx` — `./components`
- `app/src/screens/session/components/InGameView/components/InGameStepSection/InGameStepSection.tsx` — `./components`
- `app/src/screens/session/components/PrepView/PrepView.tsx` — `./components`
- `app/src/screens/session/components/PrepView/components/StepSection/StepSection.tsx` — `./components`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx` — `./components`
- `app/src/screens/session/components/StepsNavSidebar/StepsNavSidebar.tsx` — `./components`, `../../../components`
- `app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/SessionStepsNav.tsx` — `./components`
- `app/src/screens/settings/SettingsScreen.tsx` — `./components`
- `app/src/screens/settings/components/DevicesSection/DevicesSection.tsx` — `./components`
- `app/src/screens/settings/components/DevicesSection/components/OwnDevice/OwnDevice.tsx` — `../../helper`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/PairDeviceDialog.tsx` — `./components`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/components/PDDCandidatesList/PDDCandidatesList.tsx` — `../../../../helper`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/PairedDevices.tsx` — `./components`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/DeviceRow/DeviceRow.tsx` — `./components`, `../../../../helper`, `./helper`
- `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/DeviceRow/components/StatusIndicator/StatusIndicator.tsx` — `../../helper`
- `app/src/screens/settings/components/ListConfigSection/ListConfigSection.tsx` — `./components`
- `app/src/screens/index.ts` — `'./adventures/AdventuresScreen'`, `'./adventure/AdventureScreen'`, `'./session/SessionScreen'`, `'./encounter/EncounterScreen'`, `'./base-entity/BaseEntityScreen'` and `'./settings/SettingsScreen'` become `'./adventures'`, `'./adventure'`, `'./session'`, `'./encounter'`, `'./base-entity'` and `'./settings'` (each folder gains an `index.ts` above). `'./sessions/SessionsScreen'`, `'./encounters/EncountersScreen'` and `'./base-entities/BaseEntitiesScreen'` stay, because those folders hold one source file.
- `app/src/components/MentionPopup/components/MentionPopupContent/components/EntityPopupBody/EntityPopupBody.tsx` — `'../../../../../TextEditor/TextEditor'` becomes `'../../../../../TextEditor'` (`TextEditor/` gains an `index.ts` above). SF5 changes this file's `@/types` import.

Moved: none. Draft: none.

## Layered breakdown

### Data Access Layer

`data-access-layer/pinned-order/index.ts` is deleted. Its folder holds only `useSetPinnedOrder.ts`, so the DAL root `index.ts` re-exports the hook from the file directly. Every other DAL module folder holds several files and keeps its `index.ts` unchanged, including its explicit export list. The query-key files stay unexported, and `local/no-import-past-index` now enforces that they cannot be imported from outside their module.

### Frontend

Work through the lists above in this order, running `npx tsc --noEmit` from `app/` after each step:

1. Create the 28 new `index.ts` files. Each uses the explicit named export given for it (root Key Architectural Decisions — "A folder has an `index.ts` exactly when it hides something" — every `index.ts` this spec adds uses explicit named exports).
2. Rewrite every listed specifier per "How to rewrite an import", including the notes on `screens/index.ts`, `EntityPopupBody.tsx`, `UploadImgBtn.tsx` and `renderCell.test.tsx`.
3. Delete the 77 files.

Deleting last keeps every intermediate state compilable. A specifier rewritten in step 2 never names a file that step 3 deletes.

A file inside a module never imports its own module's `index.ts` or an ancestor module's `index.ts`. `import-x/no-cycle` reports any such import that closes a cycle.

## Tests

No behavior changes except the two cleanups, and neither changes observable output: returning `undefined` instead of `null` from a callback whose result is discarded. `UploadImgBtn` and `MentionTypeaheadPlugin` are React components, and `app/src/CLAUDE.md` — Testing Policy forbids component tests. Existing tests keep their assertions. Only the specifiers listed above change, among them the `vi.mock` target in `renderCell.test.tsx`.

## Verification

- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` and `npx vitest run` pass from `app/`.
- `npx eslint .` prints no `local/no-import-past-index` warning outside these files: `src/components/index.ts` (four lines, noted above), files importing `@/components`, `@/hooks`, `@/providers`, `@/types` or `@/util` (SF5), and the `@/components/<Module>/<File>` specifiers SF3 wrote.
- `find -E app/src -regex '.*/src/[^/]+/(.+/)?(helper|components|hooks|nodes|plugins|types)/index\.ts'`, run from the repository root, returns nothing. It returned 63 files at 245a4168.
