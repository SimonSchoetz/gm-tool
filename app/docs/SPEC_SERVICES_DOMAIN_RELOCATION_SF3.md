# SF3: Move services

Move `app/src/services/` to `app/services/`. Update every `@/services/<file>`
import to `@services/<file>`. No content changes inside any service file itself —
only import paths in consumers change.

Note: if `SPEC_SESSION_CASCADE.md` was implemented before this SF, the session
service files are already at `app/src/services/` and are included in the move as
normal. If it was not yet implemented, no difference — the move command covers all
files in the directory.

## Files Affected

```text
Moved:
  app/src/services/ → app/services/  (no content changes within service files)

Modified:
  app/src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx
  app/src/data-access-layer/adventures/useAdventure.ts
  app/src/data-access-layer/adventures/useAdventures.ts
  app/src/data-access-layer/images/useImage.ts
  app/src/data-access-layer/images/useImageMutations.ts
  app/src/data-access-layer/npcs/useNpc.ts
  app/src/data-access-layer/npcs/useNpcs.ts
  app/src/data-access-layer/session-steps/useSessionSteps.ts
  app/src/data-access-layer/sessions/useSession.ts
  app/src/data-access-layer/sessions/useSessions.ts
  app/src/data-access-layer/table-config/useTableConfig.ts
  app/src/data-access-layer/table-config/useTableConfigs.ts
  app/src/routes/__root.tsx
```

## Import Updates

Move the directory:

```bash
mv app/src/services app/services
```

Apply the following import replacement in every file listed above. This is an
exact string replacement — no other changes.

| Old import path | New import path |
|---|---|
| `'@/services/adventureService'` | `'@services/adventureService'` |
| `'@/services/imageService'` | `'@services/imageService'` |
| `'@/services/npcsService'` | `'@services/npcsService'` |
| `'@/services/sessionService'` | `'@services/sessionService'` |
| `'@/services/sessionStepService'` | `'@services/sessionStepService'` |
| `'@/services/tableConfigService'` | `'@services/tableConfigService'` |
| `'@/services/mentionSearchService'` | `'@services/mentionSearchService'` |
| `'@/services/database'` | `'@services/database'` |

The two inter-service imports (`adventureService.ts` and `npcsService.ts` both
import `imageService`) are moved files, not consumer files — they are covered by
the `mv` command. After the move, their internal `@/services/imageService` imports
must also be updated to `@services/imageService`. Add these two files to the
modified list above if editing them manually; the `mv` covers the file location,
not the import paths within.

No other changes to any of these files.
