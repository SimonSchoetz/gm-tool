# SF3 — Component fixes

Fix `undefined` domain values in `UploadImgBtn`, `ErrorBoundary`, and `ScreenNavBtn`. These are independent changes with no inter-dependency.

## Files Affected

**Modified:**

- `app/src/components/UploadImgBtn/UploadImgBtn.tsx`
- `app/src/components/ErrorBoundary/ErrorBoundary.tsx`
- `app/src/components/SideBarNav/components/ScreenNavBtn/ScreenNavBtn.tsx`

## Frontend

### `app/src/components/UploadImgBtn/UploadImgBtn.tsx`

**Purpose:** Remove `undefined` from the `image_id` prop type and the `error` local state type.

**Behavior:**

Fix 1 — Prop type: Change `image_id?: string | null | undefined` to `image_id?: string | null`. Drop the trailing `| undefined` — under `exactOptionalPropertyTypes`, optional props are either absent or the declared type; `| undefined` is redundant and misleads readers into thinking `undefined` is a valid explicit value.

Fix 2 — Error state: Change `useState<string>()` to `useState<string | null>(null)`. The type becomes `string | null`; the initial value is `null` rather than `undefined`.

Fix 3 — `setError` call site: The existing call `setError(err?.toString())` passes `string | undefined`. After the state type change to `string | null`, this becomes a type error. Change to `setError(err?.toString() ?? null)`.

No other changes.

**UI / Visual:** No visual change. The error display guard `{error && <p>...</p>}` already handles both `null` and a string correctly.

---

### `app/src/components/ErrorBoundary/ErrorBoundary.tsx`

**Purpose:** Replace `undefined` with `null` for the `errorStack` local variable in `ErrorFallback`.

**Behavior:**

Line 18: Change:

```ts
const errorStack = error instanceof Error ? error.stack : undefined;
```

to:

```ts
const errorStack = error instanceof Error ? (error.stack ?? null) : null;
```

`error.stack` is typed as `string | undefined` by TypeScript's built-in types — the `?? null` coercion converts the `undefined` path to `null`. The result type of `errorStack` becomes `string | null`.

No other changes.

**UI / Visual:** No visual change. The existing guard `{isDevelopment && errorStack && <details>...</details>}` handles `null` and a string identically.

---

### `app/src/components/SideBarNav/components/ScreenNavBtn/ScreenNavBtn.tsx`

**Purpose:** Remove the `& HtmlProps<'a'>` extension from `Props`. The component does not spread `...props` onto any element — the extension is a dead contract that silently drops any native anchor attributes callers might pass.

**Behavior:**

Change:

```ts
type Props = {
  label: string;
  to: AppRoute;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
  isDisabled?: boolean;
} & HtmlProps<'a'>;
```

to:

```ts
type Props = {
  label: string;
  to: AppRoute;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
  isDisabled?: boolean;
};
```

Remove the `HtmlProps` import if it is no longer used anywhere in the file after this change. (`AppRoute` and `FCProps` remain in use.)

**Call-site verification:** All four call sites of `ScreenNavBtn` in `SideBarNav.tsx` pass only `label`, `to`, `params`, and `isDisabled` — no HTML `<a>` attributes. No call-site changes are required.

**UI / Visual:** No visual change.
