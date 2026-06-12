# SF3: createGridTileTexture Test

Unit test for `createGridTileTexture.ts`.

## Files Affected

New:
- `app/src/components/Backdrop/helper/__tests__/createGridTileTexture.test.ts`

## Frontend

### Test: `helper/__tests__/createGridTileTexture.test.ts`

The function creates PixiJS `Graphics` draw commands and delegates to `app.renderer.textureGenerator.generateTexture(g)`. Testing the Graphics internals requires deep PixiJS mocking. The test scope is limited to the observable contract: the function calls `generateTexture` with a Graphics container and returns its result.

`getColor` reads via `getComputedStyle` — mock it via `vi.spyOn(window, 'getComputedStyle')`, matching the pattern in `createGridTiles.test.ts`.

`app.renderer.textureGenerator.generateTexture` is mocked via a fake `app` object.

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Graphics } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { RenderTexture } from 'pixi.js';
import { createGridTileTexture } from '../createGridTileTexture';

const cssVariables = new Map([
  ['--color-bg', '#031322'],
  ['--color-bg-rgb', '3, 19, 34'],
]);

const makeMockApp = (mockTexture: RenderTexture) =>
  ({
    renderer: {
      textureGenerator: {
        generateTexture: vi.fn().mockReturnValue(mockTexture),
      },
    },
  }) as unknown as Application;

describe('createGridTileTexture', () => {
  beforeEach(() => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => cssVariables.get(prop) ?? '',
    } as unknown as CSSStyleDeclaration);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls generateTexture once with a Graphics container', () => {
    const mockTexture = {} as RenderTexture;
    const app = makeMockApp(mockTexture);
    createGridTileTexture(app, 120);
    expect(app.renderer.textureGenerator.generateTexture).toHaveBeenCalledTimes(1);
    expect(app.renderer.textureGenerator.generateTexture).toHaveBeenCalledWith(
      expect.any(Graphics),
    );
  });

  it('returns the texture produced by generateTexture', () => {
    const mockTexture = {} as RenderTexture;
    const app = makeMockApp(mockTexture);
    const result = createGridTileTexture(app, 120);
    expect(result).toBe(mockTexture);
  });
});
```
