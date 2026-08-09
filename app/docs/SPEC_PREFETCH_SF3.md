# SF3 — Layout-stable image placeholder

Make `ImageById` hold its layout box while its query is pending, so an image arriving at any time never moves surrounding content. This is what allows list routes to skip image work entirely in SF4.

## Files affected

- `Modified:` `app/src/components/ImageById/ImageById.tsx` — pending branch renders a sized placeholder
- `Modified:` `app/src/components/ImageById/ImageById.css` — placeholder modifier class

## Frontend

### `ImageById.tsx`

**Purpose** — Renders an image resolved by id, for entity avatars in list rows, detail screen heroes, and mention popup bodies. It is the single component through which every database-backed image reaches the screen, which is why fixing layout stability here covers every surface at once.

**Behavior** — The component's three branches keep their current meanings, with only the first changing:

- Query pending → render a placeholder `div` carrying the same sizing as the loaded image, instead of the current `<div>Loading image...</div>`. The replaced element has no dimensions of its own, so it collapses to a text line's height and reflows the moment the real image replaces it; that reflow is the defect.
- No image id, or the query resolved with no url → return early rendering nothing, exactly as today. This is the "this entity has no image" case, not a loading case, and its callers already lay out for an absent image.
- Resolved → unchanged: `<img>` with `src`, the frame custom properties, and forwarded props.

The frame custom properties are not applied to the placeholder. They position and scale a loaded bitmap and have no meaning without one.

**UI / Visual** — The placeholder is `<div className='image-by-id image-by-id--pending' />`. Reusing the `image-by-id` block class is deliberate: that class is `height: 100%; width: 100%`, so the placeholder inherits the same box the parent already sizes, and the swap to `<img>` changes no geometry. The modifier carries the visual treatment only.

Because the base class also declares `object-fit`, `object-position`, and `transform`, which have no effect on a `div`, no override is needed — they are inert on a non-replaced element.

### `ImageById.css`

Add an `image-by-id--pending` modifier whose only declaration is `background-color: var(--color-bg-muted);`. That token already exists in `styles/variables/color-variables.css` and expresses a neutral recessed surface, which is what a reserved-but-unfilled image box should read as. Do not introduce a new variable — new tokens require the user's approval.

Do not add width, height, or aspect-ratio declarations to the modifier. Sizing comes from the base class and the parent, and duplicating it here would create a second source of truth for the box.

## Verification

`npx tsc --noEmit`, `npx eslint .`, and `prettier --check .` from `app/`.

Visual check under `npm run dev`: open an entity list with avatars and confirm rows do not shift vertically as images resolve. The former text placeholder makes the regression obvious if reintroduced — rows visibly jump.
