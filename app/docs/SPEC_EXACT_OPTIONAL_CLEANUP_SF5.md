# SF5 — Call-site fixes for UploadImgBtn.image_id

Coerce `adventure.image_id` and `npc.image_id` from `string | null | undefined` to `string | null` at their respective `UploadImgBtn` call sites. Required because SF3 narrows `UploadImgBtn.image_id` to `string | null`, making the uncoerced form a type error. Requires SF3 to be complete first.

## Files Affected

**Modified:**

- `app/src/screens/adventure/AdventureScreen.tsx`
- `app/src/screens/npc/NpcScreen.tsx`

## Frontend

### `app/src/screens/adventure/AdventureScreen.tsx`

**Purpose:** Coerce `adventure.image_id` at the `UploadImgBtn` call site.

**Behavior:**

Line 47: Change `image_id={adventure.image_id}` to `image_id={adventure.image_id ?? null}`.

`adventure.image_id` is `string | null | undefined` as derived from the Zod schema. After SF3, `UploadImgBtn.image_id` is `string | null`. Passing `string | null | undefined` to `string | null` is a type error under `exactOptionalPropertyTypes` — the `?? null` coercion resolves the `undefined` path.

No other changes.

**UI / Visual:** No visual change.

---

### `app/src/screens/npc/NpcScreen.tsx`

**Purpose:** Coerce `npc.image_id` at the `UploadImgBtn` call site.

**Behavior:**

Line 45: Change `image_id={npc.image_id}` to `image_id={npc.image_id ?? null}`.

`npc.image_id` is `string | null | undefined` as derived from the Zod schema. Same rationale as `AdventureScreen`.

No other changes.

**UI / Visual:** No visual change.

---

## Verification Gate

After all five sub-features are complete, run both checks. Both must pass with zero errors before committing:

```bash
npx tsc --noEmit
npx vitest run
```

Pre-existing errors and failures are not acceptable baseline — they must be resolved before implementation begins.
