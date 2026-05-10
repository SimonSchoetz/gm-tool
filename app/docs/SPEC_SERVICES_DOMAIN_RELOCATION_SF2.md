# SF2: Move domain

Move `app/src/domain/` to `app/domain/`. Update every `@/domain` and
`@/domain/<subpath>` import to `@domain` and `@domain/<subpath>` respectively.
No content changes inside any domain file itself — only import paths in consumers
change.

## Files Affected

```text
Moved:
  app/src/domain/ → app/domain/  (no content changes within domain files)

Modified:
  app/src/components/MentionPopup/MentionPopup.tsx
  app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx
  app/src/screens/session/components/PrepView/components/StepSection/StepSection.tsx
  app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx
  app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderTitle/StepSectionHeaderTitle.tsx
  app/src/screens/session/components/PrepView/components/StepSection/components/TooltipPanel/TooltipPanel.tsx
  app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/components/SortableStepItem.tsx
  app/src/services/adventureService.ts
  app/src/services/mentionSearchService.ts
  app/src/services/npcsService.ts
  app/src/services/sessionService.ts
  app/src/services/sessionStepService.ts
  app/src/services/tableConfigService.ts
```

## Import Updates

Move the directory:

```bash
mv app/src/domain app/domain
```

Apply the following import replacements in every file listed above. These are
exact string replacements — no other changes.

| Old import path | New import path |
|---|---|
| `'@/domain'` | `'@domain'` |
| `'@/domain/adventures'` | `'@domain/adventures'` |
| `'@/domain/mentions'` | `'@domain/mentions'` |
| `'@/domain/npcs'` | `'@domain/npcs'` |
| `'@/domain/table-config'` | `'@domain/table-config'` |

**Frontend files** (the first seven in the modified list) all import `from '@/domain'`
→ change to `from '@domain'`.

**Service files** use both the barrel and subdirectory forms:

- `services/adventureService.ts`: `'@/domain/adventures'` → `'@domain/adventures'`
- `services/mentionSearchService.ts`: `'@/domain/mentions'` → `'@domain/mentions'`
- `services/npcsService.ts`: `'@/domain/npcs'` → `'@domain/npcs'`
- `services/sessionService.ts`: `'@/domain'` → `'@domain'`
- `services/sessionStepService.ts`: `'@/domain'` → `'@domain'`
- `services/tableConfigService.ts`: `'@/domain/table-config'` → `'@domain/table-config'`

No other changes to any of these files.
