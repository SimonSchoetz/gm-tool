# Sub-feature 1: UpDownBtns

Extracts the presentational chevron pair of `StepSectionHeaderMoveBtn` into `src/components/UpDownBtns/`, so the content panel (SF3) and the popup (SF4) render the same pair. `StepSectionHeaderMoveBtn` keeps its session logic and renders the new component.

## Files affected

Modified:

- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderMoveBtn/StepSectionHeaderMoveBtn.tsx` — keeps `useParams`, `useSessionSteps`, the `step` lookup, `isFirst`, `isLast` and `reorderSteps`; renders `<UpDownBtns>` with labels `Move up` and `Move down`; drops the `ActionContainer`, chevron icon and `.css` imports

Moved:

- `mv app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderMoveBtn/StepSectionHeaderMoveBtn.css app/src/components/UpDownBtns/UpDownBtns.css`, then rename `.step-move-btn-container` to `.up-down-btns` and `.step-move-btn` to `.up-down-btns-btn` in every selector (the sub-component CSS rule in `app/src/CLAUDE.md` — Styles requires the new block name); declarations stay unchanged

New:

- `app/src/components/UpDownBtns/UpDownBtns.tsx`

## Layered breakdown (Frontend)

### `UpDownBtns` (`app/src/components/UpDownBtns/UpDownBtns.tsx`)

Single-file module, no `index.ts`; importers use `@/components/UpDownBtns/UpDownBtns` (from `screens/`) and the relative form from inside `components/`.

- **Purpose**: the bordered up/down chevron pair shared by every place that steps through an ordered list.
- **Behavior**: closed props API (`FCProps<Props>`), no state. Each button is an `ActionContainer` (`@/components/ActionContainer/ActionContainer`; it forwards `disabled` and `title` to its `<button>` through `HtmlProps<'button'>`, and `label` becomes the `aria-label`) whose `title` and `label` are the given label and whose `onClick` is the given handler.
- **UI / Visual**: one container `div.up-down-btns` holding the up button (`ChevronUpIcon` from `lucide-react`) then the down button (`ChevronDownIcon`), identical to the markup `StepSectionHeaderMoveBtn` renders today. Class names change as stated under Moved; the hover, disabled and scale behaviour is unchanged.

```ts
type Props = {
  upLabel: string;
  downLabel: string;
  isUpDisabled: boolean;
  isDownDisabled: boolean;
  onUp: () => void;
  onDown: () => void;
};
```

Consumers: `StepSectionHeaderMoveBtn` (this sub-feature), `BaseEntityContentSectionPanel` (SF3), `BaseEntityPopupContent` (SF4).

## Tests

None added. `UpDownBtns` is a component with no acceptance criterion its own event handling decides (every handler is a prop passed straight through); `StepSectionHeaderMoveBtn` has no test file today and its logic is unchanged.
