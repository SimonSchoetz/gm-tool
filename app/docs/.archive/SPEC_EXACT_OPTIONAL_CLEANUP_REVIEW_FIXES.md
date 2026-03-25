# SPEC: exactOptionalPropertyTypes Cleanup — Review Fixes

## Progress Tracker

- SF1: Revert `| undefined` optional prop additions and fix SortableList root cause
- SF2: Fix `DebounceEntry.timeout` null sentinel in `useSessionSteps`

## Key Architectural Decisions

### `exactOptionalPropertyTypes: true` prohibits `prop?: T | undefined`

With `exactOptionalPropertyTypes: true` enabled in `tsconfig.json`, writing
`prop?: T | undefined` is semantically incorrect. The `?` modifier already
encodes "absent" as a distinct state — adding `| undefined` widens the type to
also allow the caller to explicitly pass `undefined` as a present value, which
conflicts with the project rule: never use `undefined` as a domain value
(root CLAUDE.md). The correct form for an optional prop that has no value is
`prop?: T` — the `| undefined` suffix must be removed.

### SortableList default fills the type gap without touching the prop type

`SortableListProps.searchPlaceholder` is correctly typed as
`searchPlaceholder?: string`. Without a destructuring default, the in-scope type
of `searchPlaceholder` inside the function body is `string | undefined`.
Passing that directly to `<SearchInput placeholder={searchPlaceholder} />` —
where `placeholder` is typed `placeholder?: string` under
`exactOptionalPropertyTypes: true` — is a type error: a `string | undefined`
value cannot be assigned to an absent-only optional prop. The fix is a
destructuring default `searchPlaceholder = 'Search...'` which narrows the
in-scope type to `string`. The `SortableListProps` type declaration is not
changed. The default value `'Search...'` matches `SearchInput`'s own
destructuring default for `placeholder`.

### `DebounceEntry.timeout` uses null sentinel, not optional field

The project rule states: use `null` for "no value yet", never `undefined`
(root CLAUDE.md). `timeout?: NodeJS.Timeout` uses an optional field — meaning
the property can be absent — which is the `undefined`-as-domain-value pattern
the rule prohibits. The correct model is a required field typed
`NodeJS.Timeout | null` with an explicit `null` initial value. This matches the
established pattern in `useAdventure`, `useNpc`, and `useSession`, all of which
use `useRef<NodeJS.Timeout | null>(null)`.

### `clearTimeout` boundary adapter for null

The TypeScript DOM lib declares `clearTimeout(id: number | undefined): void` —
it does not accept `null`. The cleanup `forEach` must pass
`entry.timeout ?? undefined` to convert `NodeJS.Timeout | null` to
`NodeJS.Timeout | undefined` at the call boundary. This is a required boundary
adapter, not optional defensive code.

## SF1: Revert `| undefined` Optional Prop Additions and Fix SortableList Root Cause

Revert incorrectly added `| undefined` unions from two optional prop types, and
add a destructuring default in `SortableList` to eliminate the
`string | undefined` in-scope type that made the `SearchInput` call a type error
under `exactOptionalPropertyTypes: true`.

### Files Affected

Modified:

- `app/src/components/SearchInput/SearchInput.tsx`
- `app/src/components/ImagePlaceholderFrame/ImagePlaceholderFrame.tsx`
- `app/src/components/SortableList/SortableList.tsx`

New: none

Barrel files: `app/src/components/index.ts` and
`app/src/components/SortableList/index.ts` require no changes — both already
export the correct symbols with explicit named exports.

### Layered Breakdown

#### Frontend

**`app/src/components/SearchInput/SearchInput.tsx`**

Purpose: Removes the incorrectly widened `| undefined` from the `placeholder`
prop type so the type matches the `exactOptionalPropertyTypes` contract.

Behavior: No behavior change. The destructuring default `placeholder = 'Search...'`
already handles the absent case at runtime. The type annotation change is purely
a correctness fix.

UI/Visual: No change.

Change: Replace:

```ts
placeholder?: string | undefined;
```

with:

```ts
placeholder?: string;
```

---

**`app/src/components/ImagePlaceholderFrame/ImagePlaceholderFrame.tsx`**

Purpose: Removes the incorrectly widened `| undefined` from the `dimensions`
prop type.

Behavior: No behavior change. The optional `?` on `dimensions` already encodes
absence. The `| undefined` suffix was a redundant widening that violated
`exactOptionalPropertyTypes`.

UI/Visual: No change.

Change: Replace:

```ts
  dimensions?: {
    width: CSSProperties['width'];
    height: CSSProperties['height'];
  } | undefined;
```

with:

```ts
  dimensions?: {
    width: CSSProperties['width'];
    height: CSSProperties['height'];
  };
```

---

**`app/src/components/SortableList/SortableList.tsx`**

Purpose: Adds a destructuring default for `searchPlaceholder` so its in-scope
type is narrowed from `string | undefined` to `string`, eliminating the
`exactOptionalPropertyTypes` type error at the
`<SearchInput placeholder={searchPlaceholder} />` call site.

Behavior: No behavior change. When a caller omits `searchPlaceholder`, the
input displays `'Search...'` — identical to the previous runtime behavior
because `SearchInput`'s own destructuring default already provided `'Search...'`
for absent values. The default is now applied one layer earlier.

UI/Visual: No change.

Change: The `SortableListProps` type declaration is unchanged. In the
destructuring parameter, change `searchPlaceholder,` to:

```ts
searchPlaceholder = 'Search...',
```

## SF2: Fix `DebounceEntry.timeout` Null Sentinel in `useSessionSteps`

Replace the optional field `timeout?: NodeJS.Timeout` with a required field
`timeout: NodeJS.Timeout | null` in `DebounceEntry`, add the explicit `null`
initializer in the `map.set` call, and adapt the cleanup `clearTimeout` call to
pass `?? undefined` at the type boundary.

### Files Affected

Modified:

- `app/src/data-access-layer/session-steps/useSessionSteps.ts`

New: none

Barrel files: `app/src/data-access-layer/session-steps/index.ts` and
`app/src/data-access-layer/index.ts` require no changes.

### Layered Breakdown

#### Frontend

**`app/src/data-access-layer/session-steps/useSessionSteps.ts`**

Purpose: Aligns `DebounceEntry` with the project convention of using `null` as
the sentinel for "no value yet" and corrects the `clearTimeout` call boundary
so it compiles correctly against the TypeScript DOM type declaration for
`clearTimeout`.

Behavior: No runtime behavior change. Three sites change:

1. `DebounceEntry` type: replace `timeout?: NodeJS.Timeout;` with
   `timeout: NodeJS.Timeout | null;`.

2. `map.set` initializer: replace:

   ```ts
   map.set(stepId, { pending: { ...data } });
   ```

   with:

   ```ts
   map.set(stepId, { timeout: null, pending: { ...data } });
   ```

3. Cleanup `forEach`: replace:

   ```ts
   map.forEach((entry) => clearTimeout(entry.timeout));
   ```

   with:

   ```ts
   map.forEach((entry) => clearTimeout(entry.timeout ?? undefined));
   ```

   The `?? undefined` converts `NodeJS.Timeout | null` to
   `NodeJS.Timeout | undefined` at the `clearTimeout` call boundary, which
   does not accept `null`.

   The null guard at line 78 (`if (existing.timeout) clearTimeout(existing.timeout)`)
   is unchanged — inside the guard, `existing.timeout` is already narrowed to
   `NodeJS.Timeout` (non-null) and no boundary adapter is needed there.

UI/Visual: Not applicable — this is a data-access-layer hook with no rendering.

## CLAUDE.md Impact

None.
