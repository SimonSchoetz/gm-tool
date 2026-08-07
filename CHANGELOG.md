# Changelog

All notable changes to GM Tool are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [v0.12.0] - 2026-08-07

### Added

- Adventure headers now show live counts of sessions, PCs, NPCs, factions, locations, foes, and items
- Added a settings button to the Header

### Fixed

- Row-action and new-item button hover shadows no longer get clipped by list padding
- The row-actions menu button now fills the full height of rows without an avatar
- The text editor no longer overflows past the name input in the edit layout
- The screens sidebar now scrolls its own content instead of the whole window
- The side nav now scrolls its own content instead of the whole window

### Changed

- Moved forward/back navigation from the side nav to the Header
- Reworked the basic app layout
- Removed the duplicate settings button from the side nav and fixed its clipped shadow
- Restyled the row actions menu

## [v0.11.0] - 2026-08-07

### Added

- Every entity — NPCs, PCs, Foes, Factions, Locations, Items, and Sessions (with their session steps) — can now be duplicated from its detail screen sidebar
- The app now uses IBM Plex Sans and IBM Plex Mono throughout, self-hosted instead of relying on system fonts
- Typing `--`, `->`, or `<-` now automatically converts to an em dash or arrow (—, →, ←) in the text editor and in name, search, and delete-confirm inputs
- Any item in the seven list screens can now be pinned from a new row-actions menu — pinned items collect in a "Pinned" section above the rest of the list and persist across restarts and paired devices

## [v0.10.1] - 2026-07-30

### Fixed

- The slash command popup now highlights the focused option when navigating with arrow keys, matching what hovering already did
- Clicking an embedded link in a mention popup now opens it in the external browser instead of navigating within the app, and the link preview no longer renders behind the mention popup
- The floating text-formatting toolbar no longer closes while typing a link URL longer than the input field

### Changed

- Faction, Foe, Item, Location, NPC, and PC detail screens now share a unified layout. Name was moved out of the summary field and is now positioned above the text field
- List screens got UI overhall to be a little more compact

## [v0.10.0] - 2026-07-27

### Added

- Toggle blocks — collapsible sections with a header and body, insertable via the /toggle slash command, that also copy-paste as native `<details>`/`<summary>` elements into other applications

### Fixed

- Nested checklist items no longer draw a checkbox at every indentation level — only the deepest item shows one, and clicking where a phantom checkbox used to be no longer toggles anything in read-only mode
- The slash-command hint on an empty line inside a nested list no longer stays pinned to the left edge — it now follows the line's actual indentation

## [v0.9.0] - 2026-07-26

### Added

- @-mentions in the text editor can now be bold, italic, or underlined like any other text

### Changed

- Mention badges now show the entity's current name and color live, instead of a stale snapshot from when the mention was created
- Hovering a mention whose entity was deleted now shows a popup instead of a bare broken state
- Copying and pasting a formatted mention now preserves its formatting

## [v0.8.3] - 2026-07-24

### Fixed

- Adventures and their content created before device sync was introduced were never synced to paired devices — a migration now backfills them so they sync like any other data

## [v0.8.2] - 2026-07-24

### Fixed

- Device sync could fail to discover paired devices in the installed macOS build — the app was missing the local-network/Bonjour permission declaration required outside of `tauri dev`

### Changed

- Loading placeholders now show a loading icon instead of "Loading..." text throughout the app

## [v0.8.1] - 2026-07-24

### Fixed

- Device sync section was missing from the Settings screen — now shown again
- Typo in the "Potential Scenes" session step placeholder

## [v0.8.0] - 2026-07-24

### Added

- Device sync — pair devices on the same network and keep adventures, sessions, NPCs, and other data automatically synced across them
- Sync status indicator shown for each paired device in the Settings screen

## [v0.7.1] - 2026-07-22

### Fixed

- Elements and icons in prep view and text editor are prevented from shrinking when space gets tight
- Idle backdrop is no longer draining recources due to unnecessary rerenders

## [v0.7.0] - 2026-07-08

### Added

- Table edge handles — hover over the top or left edge of a table to insert or delete rows/columns, or toggle header rows/columns, via a popup menu

## [v0.6.0] - 2026-07-05

### Added

- `/` slash command menu in the text editor — insert headings, bullet/numbered lists, a checklist, or a table, grouped by section and navigable with arrow keys
- A hint ("Start typing or use / for commands") appears when the cursor is on an empty block
- rudimentary 3x3 Tables in the text editor — insert via the slash command

## [v0.5.2] - 2026-06-30

### Fixed

- Custom session steps Input reners again
- Removes blurron hover on holo images

## [v0.5.1] - 2026-06-30

### Fixed

- Floating toolbar no longer appears at the wrong editor's position when multiple text editors are active on the same screen
- Update check no longer briefly shows "up to date" while still loading the update status

## [v0.5.0] - 2026-06-29

### Added

- App updater in the header — check for updates, download, and install without leaving the app
- Section titles displayed in the ingame view

### Fixed

- Placeholder in the ingame view no longer appears when it should not

### Changed

- Text editors now have a maximum width to improve readability
- App version removed from the Settings screen
- App window opens at a smaller default size

## [v0.4.0] - 2026-06-28

### Added

- Background animation toggle in the Settings screen — disable the animated beams while keeping the grid visible

## [v0.3.0] - 2026-06-28

### Added

- Embedded links in the text editor — select text, enter a URL, and it renders as a clickable link
- Floating toolbar now displays link controls alongside text formatting options
- Shared `EditorPopup` component unifies popup positioning across all editor overlays

### Fixed

- Toolbar positioning now updates immediately when formatting changes reflow text
- Toolbar no longer closes when removing a format that collapses the selection
- Open-link popup no longer appears while dragging to create a text selection
- Link state resets correctly when clicking outside the toolbar
- Image title hover area fixed
- Divider height restored after layout refactor

## [v0.2.1] - 2026-06-14

### Changed

- Holo image title hidden on all screens except the adventure screen
- Holo FX visual refinements: adjusted beam and glare effect

## [v0.2.0] - 2026-06-05

### Added

- New app logo

## [v0.1.0] - 2026-06-04

### Added

- Initial release
