# Product Backlog

## MVP

### Horizontal Build

- Fix: Claude's Frontend Implementation
- Feature: Summary Popup
  - Feature: Pin-to-foreground functionality
- Feature: Image detail vs reupload
- Feature: Image Drag&Drop
- Feature: Pin favorites in list screens and make them orderable via drag&drop
- Feature: Random Tables

### Vertical Build

- Feature: PC Screens
- Feature: Faction Screens
- Feature: Monster Screens
- Feature: Items Screens
- Feature: Places Screens
- Feature: References List (Where each screen is tagged)
- Feature: Session Log Screen

### Tech Debt

- Fix: Apply `buildCreateQuery` to all remaining DB `create.ts` files (adventure, npc, image, table-config)
- clarify: other code quality assurances next to typescript rules and eslint? Also: smth similar for rust?

---

### Done

- Fix: exactOptionalPropertyTypes cleanup
- Refactor: Enums to types
- Fix: Claude's .md formatting vs lint rules
- Fix: Claude's output adding stuff like "Good question"
- Refactor: Error Handling
- Feature: Automated commit message generation from branch name
- Fix: Tests
- Feature: Session Screens (incl. Lazy DM Steps)
- Fix: Move `AppRoute` type declaration into `ScreenNavBtn.tsx`, delete `types/appRoute.type.ts`
