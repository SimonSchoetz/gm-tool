import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// The import above makes this file a module, so `declare module` augments vitest's own declarations. vitest reads `Matchers<R, T>` and no longer reads the global `jest.Matchers` that `@testing-library/jest-dom` augments. jest-dom's own `@testing-library/jest-dom/vitest` augments `Assertion<T>` with one type parameter against vitest's two, which is TS2428 and only stays silent under `skipLibCheck`. The type parameters below repeat vitest's declaration exactly, because a merged interface must match it.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions -- declaration merging into vitest's `Matchers` requires an `interface` whose only content is the jest-dom matchers it extends; a type alias cannot augment an existing interface
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- a merged interface must repeat vitest's type parameter names, and `T` is only consumed by vitest's own declaration
    T = unknown,
  > extends TestingLibraryMatchers<unknown, R> {}
}
