# Sub-feature 2: Section stepping and slide primitive

`useListNavigation` gains stepping and a recorded transition; a new `SlideTransition` component plays the vertical slide. Both are consumed by SF3 (entity-screen panel) and SF4 (popup).

## Files affected

Modified:

- `app/src/hooks/useListNavigation.ts` — new return fields and handlers below
- `app/src/hooks/__tests__/useListNavigation.test.ts` — extended with the behaviours below; the existing tests stay valid (`select`, `selected`, nav visibility are unchanged)

New:

- `app/src/types/slideDirection.type.ts` — `export type SlideDirection = 'forward' | 'backward';` (consumed by the hook and `SlideTransition`, two unrelated modules, so it lives in `types/`)
- `app/src/components/SlideTransition/SlideTransition.tsx`
- `app/src/components/SlideTransition/SlideTransition.css`

## Layered breakdown (Frontend)

### `useListNavigation`

Contract added to the return type (`ListNavigation<T>`); `T extends { id: string }` is unchanged:

```ts
type ListTransition<T> = { from: T; direction: SlideDirection };

type ListNavigationStepping<T> = {
  transition: ListTransition<T> | null;
  hasPrevious: boolean;
  hasNext: boolean;
  stepPrevious: () => void;
  stepNext: () => void;
  endTransition: () => void;
};
```

Behaviour:

- `hasPrevious` and `hasNext` compare the index of `selected` in `items` with the ends; both are `false` for an empty list and for a single item. No wrap-around.
- `select(id)` and both step handlers call one shared local function that, when `selected` is non-null, the target exists in `items` and the target id differs from `selected.id`, stores `transition = { from: selected, direction }` with `forward` when the target's index is greater than the selected index and `backward` otherwise; otherwise it stores no transition. `select` keeps its existing `setSelectedId` and `setIsNavOpen(false)` effects.
- `stepPrevious` and `stepNext` select the neighbouring item and do nothing at the ends. They leave the nav state unchanged.
- A fallback selection (the selected id left `items`) stores no transition.
- Calling a select or step handler while a transition exists replaces it; `from` is the then-current `selected`.
- `endTransition` sets `transition` to `null`.

### `SlideTransition` (`app/src/components/SlideTransition/`)

Single-file module plus CSS, no `index.ts`.

```ts
type Props = {
  slide: { direction: SlideDirection; outgoing: ReactNode } | null;
  onEnd: () => void;
  className?: string;
  children: ReactNode;
};
```

- **Purpose**: shows `children` in flow and, while `slide` is non-null, slides the previous content out and `children` in.
- **Behavior**: root `div` takes `className` through `cn`. `children` sit in an incoming `div` that carries a direction modifier class (`slide-transition-incoming--forward` or `--backward`) while `slide` is non-null. The outgoing node is rendered in a second `div` with the `inert` attribute (typed `inert?: boolean` in `@types/react`) and the matching modifier class, only while `slide` is non-null. `onAnimationEnd` on the incoming `div` calls `onEnd` when `event.target === event.currentTarget`, so an animation inside the children does not end the slide. With `slide === null` only the incoming `div` renders, with no modifier.
- **UI / Visual**: forward: the outgoing content moves from its place up and out while the incoming content comes in from below; backward is the mirror. The root is `position: relative; overflow: hidden`; the outgoing `div` is `position: absolute; inset: 0`, so the root's height follows the incoming content only. Both slots animate `transform: translateY` over `var(--transition-fast)` with `ease-out`; keyframes are named for the block (`slide-transition-in-forward` and so on). The outgoing slot also sets `pointer-events: none`.

Consumers: `BaseEntityContentSectionPanel` (SF3), `EntityPopupBody` (SF4, which receives the same `slide` shape one level up in its `summarySlide` prop); `useListNavigation`'s new fields are consumed by the same two sub-features through `BaseEntityContentSectionPanel` and `BaseEntityPopupContent`.

## Tests

`useListNavigation.test.ts` behaviours (each catches the named defect in the hook's own logic):

- Stepping moves to the neighbouring item in list order — catches a stepper that moves by the wrong sign or off by one.
- `hasPrevious` is false on the first item and `hasNext` false on the last, and a step at an end changes nothing — catches a wrap-around or an out-of-range select.
- Stepping forward records `direction: 'forward'` and the previous item as `from`; stepping back records `'backward'` — catches swapped directions or a `from` taken after the update.
- `select` of a later item records `forward`, of an earlier one `backward` (the burger case) — catches a direction derived from the call kind instead of item order.
- `select` of the already selected id records no transition — catches a slide from a section to itself.
- A fallback selection after the selected item leaves the list records no transition — catches a stale direction on a fallback.
- `endTransition` clears the transition — catches a transition that never ends.

## Hand-verification (no automated test: the outcome depends on layout and animation, which jsdom does not compute)

- [MANUAL-VERIFY] Forward step: the current content moves up and out while the new content enters from below; backward is the reverse. Verify in the web-mode browser pane in SF3 and SF4.
- [MANUAL-VERIFY] The outgoing content is gone after the animation and the host's height follows only the incoming content during it.
- [MANUAL-VERIFY] The animation does not run for a fallback selection.

Add a named code comment at the `onAnimationEnd` guard in `SlideTransition.tsx` stating that the `target === currentTarget` check keeps an animation inside the children from ending the slide early, which would remove the outgoing content mid-animation.
