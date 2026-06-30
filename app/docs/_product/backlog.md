# Product Backlog

## Closed Beta Ready
- Text editor enhancements
  - name tags should update when the reference changes
  - name tags should be copy/pasteable
  - '/' command to open text formatter so one can start typing a header from the beginning
  - Auto-Correct off (?)
  - drag-and-drop content within editor
  - Tables
  - arrow conversion '-> ' to '→' <- is this maybe a font thing or is this something the editor must do?
- Fix: Adventure stats (facts)
  - drag-and-drop content into editor
    - images, pdfs -> how to handle these?
  - Lists: Mixed lists text-editors with no content -> should be nothing
- Feature (Session Screen): Foldable Prep Sections
- Feature: Data access and db location/localization
  - encryption?
- Fix (Summary Pop Up): 
  - width should be same as in screens
  - should be able to open images in full screen
  - click on embedded link opens within app instead of external browser -> Bug or feature? -> Would need tabs ect.
- Feature: Implement prefetching
- Fix (Text Editor): tab on checkbox list item should not result in multiple "shadow" checkboxes
- Fix (Images): when changing the image preview, the adjustment in the background should be smooth again

### Done

- Fix (Session Screen): Highlightiing the step title should not open the toolbar
  - issue concerned all screens with multiple text editors
- Feature (Session Screen): Show section headings in In Game view
- Fix (Session Screen): In Game view shows `'Description...'` of overlapping
- Fix (Text Editor):  Max-char-length-per-line
- Feature: Automatic updates
  - UX update so user can trigger update manually
- Feature: Make background animation optional in settings
- Feature (Text Editor): Embedded links
- HoloImg Title width fix <- needs to be full width
- Enforce toolbar within window
- embedded links
- Fix: White BG on app start
- Feature: Own placeholder logo that replaces the tauri logo
- Feature: Automatic updates
  - versioning
  - github pipeline for automated builds (windows & macos)
- Feature: db migrations
  - Baseline:
    - seed data like colors
    - table config sorting
- clarify: other code quality assurances next to typescript rules and eslint? Also: smth similar for rust?


## Open Beta Ready

- Epic: Stable and secure build for mac and windows (maybe linux)
  - hard drive access (as wide as need be, as narrow as possible)
  - managing data directory
    - first start: should ask if relocate or create new
      - relocate db functonality
      - chosing db/asset location functionality
- Epic: Online community
- Feature(POC): peer-to-peer network to autosync between different devices
  - import with merging strategy

## v1.0.0 Ready

- Epic: Infrastructure to provide app downloads
- Developer ID and notarized app 
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
- Feature (Text Editor): External links
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
  - compact notes (keep meaning and context and shorten text with grammar adjustments ect.), e. g. `"beschützt die Kinder von Grüfing Sansuri"` -> `"schützt Gräfin Sansuri's Kinder"`

## Done

### MVP

- `__root.tsx` -> resolve question in line 9
- get rgb from input type=color instead of hex
- Feature: Items Screens
- Feature: Locations Screens
- Feature: Factions Screens
- fix: tests
  - need revision if written tests make sense
- Feature: PCs Screens
- Feature: Foes Screens
- Refactor: components/AdventureComponents to sub components of adventures screen
- Feature: Image detail vs reupload
- Feature: Image upload with area selection
- Feature: Summary Popup
  - Feature: Pin-to-foreground functionality
- Fix: Apply `buildCreateQuery` to all remaining DB `create.ts` files (adventure, npc, image, table-config)
- Feature: Breadcrumbs in header section can be used for navigation
- Feature: One-click-capability for delete dialog
- Fix: exactOptionalPropertyTypes cleanup
- Refactor: Enums to types
- Fix: Claude's .md formatting vs lint rules
- Fix: Claude's output adding stuff like "Good question"
- Refactor: Error Handling
- Feature: Automated commit message generation from branch name
- Fix: Tests
- Feature: Session Screens (incl. Lazy DM Steps)
- Fix: Move `AppRoute` type declaration into `ScreenNavBtn.tsx`, delete `types/appRoute.type.ts`

---
