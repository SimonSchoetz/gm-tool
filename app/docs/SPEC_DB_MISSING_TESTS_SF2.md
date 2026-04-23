# SF2: image/replace test

Add the missing test for `image.replace`. The function composes `remove` and `create`, so sibling modules are mocked directly rather than wiring up the full SQL + Tauri invoke stack.

## Files Affected

**Modified:** none

**New:**

- `app/db/image/__tests__/replace.test.ts`

## Layered Breakdown

### DB layer

**`app/db/image/__tests__/replace.test.ts`**

Mocks:

```ts
vi.mock('../remove', () => ({ remove: vi.fn() }));
vi.mock('../create', () => ({ create: vi.fn() }));
```

Import under test: `import { replace } from '../replace'`.

Capture mock references after the mocks are declared but before the import of the module under test:

```ts
import { remove as mockRemove } from '../remove';
import { create as mockCreate } from '../create';
```

Cast with `vi.mocked()` or as `ReturnType<typeof vi.fn>` as needed for type-safe mock configuration.

In `beforeEach`: `vi.clearAllMocks()`. Default behavior: `mockRemove` resolves to `undefined`, `mockCreate` resolves to `'new-image-id'`.

Test cases:

1. `should call remove with the old id, then create with the given data, and return the new id`
   - `const result = await replace('old-id', { filePath: '/path/to/image.jpg' })`
   - Assert `mockRemove` called with `'old-id'`
   - Assert `mockCreate` called with `{ filePath: '/path/to/image.jpg' }`
   - Assert `result` equals `'new-image-id'`

2. `should propagate error if remove throws`
   - Configure `mockRemove` to reject with `new Error('remove failed')`
   - Assert `replace('old-id', { filePath: '/path/to/image.jpg' })` rejects with message `'remove failed'`
   - Assert `mockCreate` not called

3. `should propagate error if create throws`
   - `mockRemove` resolves normally
   - Configure `mockCreate` to reject with `new Error('create failed')`
   - Assert `replace('old-id', { filePath: '/path/to/image.jpg' })` rejects with message `'create failed'`
