# Product Backlog

## Closed Beta Ready

- Fix (UX): When I highlight text in text editor and hover over a mention badge, a pop up might interrupt the highlighting -> while highlighting, the pop up should be supressed
- Fix (UX): Text editor height in summary fields
- Fix (UX): List item spacings (check list indentation is different to normal list)
- Fix (UI): Placeholder on checkbox list item is a single-char straight line, overflowing all contents below
- Fix (UX Toggle enter behavior):
  - Trying to add a mention badge with hitting enter in toggle heading not working -> hitting enter adds new line instead. Hitting enter when mention badge pop up is open should add the badge.
  - When Toggle is collapsed: Hitting enter at the end of the line of the toggle header should create a new node below and focus the new node
  - copy/pasting toggle sections has weird behavior, e.g. might add lines above the toggle header into the header. Then, it can't be deleted. When trying to delete the first line, it deletes the whole toggle (because its the first char of the first line). When I try to delete the second line, it doesn't work
- Fix (UX Toggle header backspace behavior): Toggle header: when at beginning of new line in toggle header and you hit backspace, the toggle header is deleted entirely even though it is not empty
- Encounter:
  - Feature (Stat Block): Summary field of PC, NPC, Foes and Items get tabs to switch between RP and Stat Block view.
    - \+ icon that lets you add new tabs with different stat block views
  - sidebar element similar to session nav that represents the combatents in turn order that can be changed via drag-and-drop
  - header: images / placeholder of combatents mirroring order of sidebar
  - body:
    - text editor for combat notes
    - click on combatent shows their summary field
      - input field for HP, possibly prefilled via data from stat block and overwritable
      - input field for accumulated dmg
- Text editor:
  - Auto-Correct off (?)
  - Lists: Mixed lists should be possible
- Feature: Data access and db location/localization
  - encryption?
- Feature: Syncing in progress indicator in Header
- Feature: right click context menu with inspect mode
- Feature: Right sidebar. Present in Screens like AdventureScreen, PCScreen, ect. Usage: Upload additional content. First step: Additional Images. Coming after: other documents types. Moreover: Different tabs with e.g. a table of content based on headings
- Fix (test strategy):
  - should earn their place.
    - should cover the full (whatever full means and if this is feasible) outcome
    - should cover error handling (should not throw or throw and what's the expected error message)
    - example: 6d7a5df5 feat(adventure-stat-counts): refactor getDateTimeString.test to have useful tests

## Open Beta Ready

- Epic: Stable and secure build for mac and windows
  - hard drive access (as wide as need be, as narrow as possible)
  - managing data directory
    - first start: should ask if relocate or create new
      - relocate db functonality
      - chosing db/asset location functionality
- Epic: Online community

## v1.0.0 Ready

- Epic: Infrastructure to provide app downloads
- Developer ID and notarized app
- Licencing
- Feature (Content): Onboarding
- Feature (Content): Revise All existing texts like session step tooltips and templates
- Feature (Content): Session Zero / Safety Tools
- Feature: Custom title bar

## Ideas Dump (unsorted)

- Feature: Foldable Prep Sections
- Feature: On-Page-Search (cmd+f)
- Feature: full data export for manual backups
- Feature: data import from manual backups
  - needs to take care of versions of db (e.g. newer version of db schema is tried to be loaded into old version of app)
- Feature: Session export (i.e. as pdf)
- Feature: Random Tables (see feature outline)
- Epic: NPC Generator
  - config like lists of traits & quirks, backgrounds, ancestries, etc.
  - For quick, random generation: mechanic how common e. g. a ancestries in this world is
- Feature (Text Editor): Embedded images
- Feature: Pin favorites in list screens and make them orderable via drag&drop
- Feature: References List (Where each screen is tagged)
- Feature: Session Log Screen
- Feature: Image Drag&Drop
- Epic: Loot generator
- Epic: Monster generator
- Epic: Combat generator
- Epic: Combat screen
  - displays combatants and their order, conditions, turns, and combat events. ect.
- Feature: Source Material organization
  - Feature: Bulk import material, e. g. items
- AI USAGES
  - compact notes (keep meaning and context and shorten text with grammar adjustments ect.), e. g. `"beschützt die Kinder von Gräfin Sansuri"` -> `"schützt Gräfin Sansuri's Kinder"`
