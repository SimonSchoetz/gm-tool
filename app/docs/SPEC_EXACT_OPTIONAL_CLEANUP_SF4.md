# SF4 — MentionNode null sentinel

Replace `string | undefined` with `string | null` for `adventureId` across `MentionNode`, `MentionBadge`, and the construction call site in `MentionTypeaheadPlugin`.

## Files Affected

**Modified:**

- `app/src/components/TextEditor/nodes/MentionNode.tsx`
- `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx`
- `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx`

## Frontend

### `app/src/components/TextEditor/nodes/MentionNode.tsx`

**Purpose:** Replace all uses of `undefined` as the "no adventureId" sentinel with `null`.

**Behavior — five targeted changes:**

1. **`SerializedMentionNode.adventureId` type:** Change `adventureId?: string | undefined` to `adventureId?: string`. The serialized JSON key is either absent or a string — `undefined` is never written to it. Removing `| undefined` makes the type accurate.

2. **`__adventureId` instance field:** Change `__adventureId: string | undefined` to `__adventureId: string | null`.

3. **Constructor parameter and field assignment:** Change the parameter `adventureId?: string` to `adventureId?: string | null`. Change the field assignment from `this.__adventureId = adventureId` to `this.__adventureId = adventureId ?? null`.

4. **`exportJSON` guard:** Change `if (this.__adventureId !== undefined)` to `if (this.__adventureId !== null)`.

5. **`importJSON` call:** Change the `adventureId` argument from `json.adventureId` to `json.adventureId ?? null`. `json.adventureId` is `string | undefined` (optional property); the coercion produces `string | null` to match the updated constructor signature.

**No change needed for `clone()`:** `node.__adventureId` is now `string | null`, which is assignable to the updated constructor parameter `adventureId?: string | null`. The call site `new MentionNode(..., node.__adventureId, node.__key)` is already correct.

**No change needed for `decorate()`:** `adventureId={this.__adventureId}` passes `string | null` to `MentionBadge.adventureId?: string | null` — valid under `exactOptionalPropertyTypes` because `null` is in the declared union.

**UI / Visual:** No visual change.

---

### `app/src/components/TextEditor/components/MentionBadge/MentionBadge.tsx`

**Purpose:** Update the `adventureId` prop type to match the updated `MentionNode` field type.

**Behavior:**

In `Props`, change `adventureId?: string | undefined` to `adventureId?: string | null`.

The `handleClick` logic uses a truthiness check (`adventureId ? path-with-id : path-without-id`). Truthiness handles `null` and `undefined` identically — no logic change needed.

**UI / Visual:** No visual change.

---

### `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin.tsx`

**Purpose:** Coerce `option.result.adventureId` from `string | undefined` to `string | null` at the `MentionNode` construction site.

**Behavior:**

Line 72: Change:

```ts
option.result.adventureId,
```

to:

```ts
option.result.adventureId ?? null,
```

`MentionSearchResult.adventureId` is typed `string | undefined` (optional property). The updated `MentionNode` constructor accepts `adventureId?: string | null`. Under `exactOptionalPropertyTypes`, passing `undefined` to `string | null` is a type error — the coercion resolves it.

No other changes.

**UI / Visual:** No visual change.
