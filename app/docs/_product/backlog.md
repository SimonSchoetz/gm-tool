# Product Backlog

## MVP

### Horizontal Build

- Feature: Factions Screens
- Feature: Items Screens
- Feature: Locations Screens

### Tech Debt

- clarify: other code quality assurances next to typescript rules and eslint? Also: smth similar for rust?
- `__root.tsx` -> resolve question in line 9
- get rgb from input type=color instead of hex

---

### Done

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

## Post MVP

### Closed Beta Ready

- Fix: White BG on app start
- Feature: db migrations
  - Baseline:
    - seed data like colors
    - table config sorting
- Epic: Stable build for mac and windows (maybe linux)
  - hard drive access (as wide as need be, as narrow as possible)
  - managing data directory
    - first start: should ask if relocate or create new
      - relocate db functonality
      - chosing db/asset location functionality
- Feature: full data export for manual backups
- Feature: data import from manual backups
- Feature(POC): local network to autosync between different devices
  - import with merging strategy

### Open Beta Ready

- Epic: Website to download the latest build
- Epic: Online community
- Feature: (automatic) updates
- Feature (Content): Onboarding
- Feature (Content): Session Zero

### Ideas Dump (unsorted)

- Feature: Random Tables (see feature outline)
- Epic: NPC Generator
  - config like lists of traits & quirks, backgrounds, species, etc.
    - For quick, random generation: mechanic how common e. g. a species in this world is
- Feature (Text Editor): External links
- Feature (Text Editor): Embedded images
- Feature: Implement prefetching
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
