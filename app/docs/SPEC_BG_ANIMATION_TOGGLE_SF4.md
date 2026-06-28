# SF4 — Backdrop Wiring

Wire `Backdrop` to read the `background` setting and gate beam initialisation on it.

## Files Affected

```
Modified: src/components/Backdrop/Backdrop.tsx
```

## Frontend

### Purpose

`Backdrop` must stop beam animation when `animation_enabled` is `false` while keeping the grid visible. Because `Backdrop` is globally mounted in `AppContent` and never unmounts, the response must be reactive: a setting change must take effect without a page reload.

### Behavior

- Call `useSetting('background')` at the top of the component. Derive `animationEnabled` from the returned value:
  ```ts
  const { value: backgroundSettings } = useSetting('background');
  const animationEnabled = backgroundSettings?.animation_enabled ?? null;
  ```
  `animationEnabled` is `boolean | null`. `null` means the query has not yet resolved.

- Add `animationEnabled` to the `useEffect` dependency array (replacing the current `[]`). React will run the cleanup and re-run the effect whenever `animationEnabled` changes. The effect cleanup already destroys the Pixi instance — no additional teardown is needed.

- At the very top of the `useEffect` callback body, add a null guard:
  ```ts
  if (animationEnabled === null) return;
  ```
  When null, the effect exits without initialising Pixi. Once the query resolves (essentially instant for local SQLite), the effect re-runs with the correct boolean value.

- Inside the `init` async function, after the `TilingSprite` is added to `pixiApp.stage` and before the beam render texture is created, add:
  ```ts
  if (!animationEnabled) return;
  ```
  When `false`, the function returns here. The grid (`TilingSprite`) is already on the stage and will render; beam objects are never created.

- The `handleResize` function currently guards with `if (!app || !tilingSprite || !beamSprite) return`. Split this into two independent guards:
  1. `if (!app || !tilingSprite) return;` — required for any resize (grid present).
  2. The beam-specific block (`beamRenderTexture.destroy`, `RenderTexture.create`, `beamSprite.texture = ...`) runs only when both `beamRenderTexture` and `beamSprite` are non-null — wrap it: `if (beamRenderTexture && beamSprite) { ... }`.
  3. The `beams.forEach` and `spawnAllBeams()` calls at the end of `handleResize` also run only when animation is enabled. Wrap them: `if (animationEnabled) { beams.forEach(...); spawnAllBeams(); }`.
  `animationEnabled` is captured by the `handleResize` closure; it is fresh per effect invocation because the effect re-creates `handleResize` each time it runs (as a local variable inside the effect body).

### UI / Visual

No visual change when `animationEnabled` is `true` — existing behaviour is preserved exactly. When `false`, the grid is visible and static; no beams appear. The `backdrop-container` div and its CSS remain unchanged.

### Import to add

`import { useSetting } from '@/data-access-layer';`

Insert after the existing `import { useEffect, useRef } from 'react';` line. `Backdrop` is at `src/components/Backdrop/Backdrop.tsx` — not inside `src/data-access-layer/`, so the grouping-barrel circular import rule does not apply.
