# Changelog

All notable changes to GM Tool are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
