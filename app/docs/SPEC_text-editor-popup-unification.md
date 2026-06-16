# Spec: TextEditor Popup Unification

Implementation status: all four sub-features are implemented, verified (`npx eslint .`, `npx tsc --noEmit`, `npx vitest run`, `npx prettier --check .` all pass), and committed. This spec documents the resulting structure and the decisions behind it. **Two follow-up items are not yet done — see [Outstanding Work](#outstanding-work) below.**

## Progress Tracker

- SF1: `EditorPopup` shared component [FOUNDATION: SF2–SF4 depend on this] — positioning, portal, and scroll-gluing logic shared by all three TextEditor overlays — ✅ implemented, commit `db48d73`
- SF2: `FloatingToolbar` migration — mouseup-gated visibility, anchors to the selection range via `EditorPopup` — ✅ implemented, commit `0bbb916`
- SF3: `EmbeddedLinkPlugin` migration — anchors to the clicked link's DOM element via `EditorPopup` — ✅ implemented, commit `3ade72f`
- SF4: `MentionTypeaheadPlugin` migration — renders through `EditorPopup` inside `menuRenderFn` instead of portaling to Lexical's anchor element — ✅ implemented, commit `d83169b`

## Key Architectural Decisions

### Scroll anchoring re-measures live, it does not freeze document coordinates

`body { overflow: hidden }` (`src/styles/global.css`) disables window-level scrolling app-wide. Screens that host `TextEditor` scroll their content through `CustomScrollArea` (`src/components/CustomScrollArea/CustomScrollArea.tsx`), a native `overflow-y: scroll` container with a custom thumb overlay — confirmed by reading `NpcScreen.tsx`, which wraps `TextEditor` in `CustomScrollArea`. A design that captures `window.scrollX/Y` once and adds it to a frozen `DOMRect` only stays correct under window-level scrolling; it does not track `CustomScrollArea`'s internal scroll.

`EditorPopup` instead uses `position: fixed` and re-derives the anchor's `getBoundingClientRect()` on every scroll event, via a capture-phase listener on `document`: `document.addEventListener('scroll', handler, true)`. Capture-phase listening on `document` receives scroll events dispatched by any descendant scrollable element — including `CustomScrollArea`'s container — without `EditorPopup` needing a reference to whichever element actually scrolls. `position: fixed` coordinates are always viewport-relative, matching what `getBoundingClientRect()` already returns, so no scroll-offset arithmetic is needed.

### `getAnchorRect` is a callback, not a `DOMRect` prop

Each consumer passes `getAnchorRect: () => DOMRect | null` rather than a pre-computed `DOMRect`. This lets `EditorPopup` re-derive the current position — on mount and on every scroll event — from a stable reference the consumer owns (a `Range` for `FloatingToolbar`, a DOM `Element` for `EmbeddedLinkPlugin`, Lexical's `anchorElementRef` for `MentionTypeaheadPlugin`), without the consumer managing its own scroll-driven re-render logic.

### Viewport-edge clamping defers `setState` into a `ResizeObserver` callback

`eslint-plugin-react-hooks@^7.0.1`'s `recommended` config — already active via `reactHooks.configs.flat.recommended` in `eslint.config.js` — includes two React-Compiler-derived rules: `react-hooks/set-state-in-effect` (bans calling a state setter synchronously at the top level of an effect body) and `react-hooks/refs` (bans reading `ref.current` during render). Both were verified active in this exact codebase against a scratch file — not assumed from the rules' `recommended` classification, since the pre-refactor `FloatingToolbar.tsx` used precisely the pattern these rules ban (a `useEffect` reading `toolbarRef.current.getBoundingClientRect()` and calling `setPosition` synchronously) yet passed `eslint` cleanly. That pass is not evidence the pattern is safe: the React Compiler's analysis bails out elsewhere in that file (most likely Lexical's complex generic types), silently skipping diagnostics for the whole component. A fresh, simpler file does not get the same free pass — confirmed directly: an isolated file using the identical pattern produced two `react-hooks/set-state-in-effect`/`react-hooks/refs` errors.

`EditorPopup` resolves this by measuring inside a `ResizeObserver` registered in an effect, calling `setHorizontalOffset` only from within the observer's callback — the same "subscribe to an external system, setState in its callback" pattern already used for the scroll listener, and the pattern the rule's own description names as correct. The user chose this over keeping the original synchronous pattern with a rule suppression, and over dropping edge clamping entirely. Trade-off: a popup that first renders right at a viewport edge displays unclamped for one frame, then snaps into place once the observer's first callback fires.

### Horizontal clamp math lives in `EditorPopup/helper/calculateHorizontalClampOffset.ts`

Per the Component Library convention (`app/src/CLAUDE.md`), pure transformations supporting a component belong in `ComponentName/helper/`, not inline in the component body. `calculateHorizontalClampOffset` takes `{ anchorCenterX, popupWidth, viewportWidth, edgePadding }` and returns the offset needed to keep the popup within the viewport. Its parameters are plain numbers rather than a `DOMRect` so the function — and its test — carry no DOM/`jsdom` dependency.

### `FloatingToolbar` drops `isFocused`, `selected`, `position`, `cursorPosition`, and the `mousemove` listener

These existed to drive the old mouse-position-based visibility logic, wrapped in `editorState.read()`. The new design reads `window.getSelection()` directly (a native DOM API — no `editorState.read()` needed) and gates visibility on `mouseup` rather than `mousemove`, so none of these have a remaining reader. `isMouseDownRef` (distinguishes an in-progress drag selection from a completed one) and `selectionRangeRef` (the stable `Range` that `getAnchorRect` re-measures) replace them. `registerUpdateListener` is also dropped — `SELECTION_CHANGE_COMMAND` alone is sufficient since visibility no longer depends on reading Lexical's editor state.

### `EmbeddedLinkPlugin` anchors to the link's DOM element, not click coordinates

`LinkNode.createDOM()` (`node_modules/@lexical/link/LexicalLink.dev.js:64`) creates an `<a>` element, so `(event.target as Element).closest('a')` reliably resolves the clicked link's DOM node from the `CLICK_COMMAND` event target. The popup anchors to that element's `getBoundingClientRect()` instead of the click coordinates, matching the "centered on the triggering element" requirement uniformly across all three popups. The pre-existing `--rt-` custom-property convention is not implicated — no DB-sourced values are involved here.

### `MentionTypeaheadPlugin` no longer portals to Lexical's anchor element

`LexicalTypeaheadMenuPlugin`'s `menuRenderFn` previously called `createPortal(content, anchorElementRef.current)` directly. It now returns `<EditorPopup getAnchorRect={...}>...</EditorPopup>`, and `EditorPopup` performs its own `createPortal` to `document.body`. `anchorElementRef.current.getBoundingClientRect()` is read inline in `menuRenderFn`'s body — not inside a hook — because `menuRenderFn` is a plain render callback, not a component; there is no hook-based alternative available at that call site. The guard immediately above the read (`if (anchorElementRef.current === null || menuOptions.length === 0) return null`) guarantees a non-null element at the point of the read. Lexical's keyboard navigation, option highlighting, and selection logic are unaffected — only the visual portal target changed.

---

## SF1: `EditorPopup` shared component

[FOUNDATION: SF2–SF4 depend on this. Stage as unit: `src/components/TextEditor/components/EditorPopup/EditorPopup.tsx`, `src/components/TextEditor/components/EditorPopup/EditorPopup.css`, `src/components/TextEditor/components/EditorPopup/index.ts`, `src/components/TextEditor/components/EditorPopup/helper/calculateHorizontalClampOffset.ts`, `src/components/TextEditor/components/EditorPopup/helper/index.ts`, `src/components/TextEditor/components/EditorPopup/helper/__tests__/calculateHorizontalClampOffset.test.ts`, `src/components/TextEditor/components/index.ts`. Do not run baseline checks after this SF alone — run only after SF2, SF3, and SF4 are also complete.]

Implements the shared positioning/portal primitive: centers horizontally on the anchor, places its bottom edge at the anchor's top edge, scroll-glues via live re-measurement, and clamps against viewport edges.

### Files affected

```text
New:
  src/components/TextEditor/components/EditorPopup/EditorPopup.tsx
  src/components/TextEditor/components/EditorPopup/EditorPopup.css
  src/components/TextEditor/components/EditorPopup/index.ts
  src/components/TextEditor/components/EditorPopup/helper/calculateHorizontalClampOffset.ts
  src/components/TextEditor/components/EditorPopup/helper/index.ts
  src/components/TextEditor/components/EditorPopup/helper/__tests__/calculateHorizontalClampOffset.test.ts

Modified:
  src/components/TextEditor/components/index.ts — add `export { EditorPopup } from './EditorPopup/EditorPopup';` (explicit named export, alongside the existing `FloatingToolbar` and `MentionBadge` entries)
```

Implementation status: complete and verified, commit `db48d73`.

### Frontend

**Purpose** — a single component owns portal rendering and positioning for every TextEditor popup, so the five behavioral requirements (mouseup-only visibility is consumer-owned; horizontal centering, vertical anchor-top placement, scroll gluing, and content-height adaptation are `EditorPopup`-owned) are implemented once instead of three times.

**Behavior**:
- Props: `getAnchorRect: () => DOMRect | null`, `children: ReactNode`, `onClickOutside?: () => void`.
- Renders `null` when `getAnchorRect()` returns `null` at render time — visibility is entirely consumer-driven; `EditorPopup` does not track an internal open/closed state.
- A capture-phase `scroll` listener on `document` forces a re-render (via a `useReducer` tick) on every scroll event anywhere in the document, causing `getAnchorRect()` to be re-evaluated with the current DOM state.
- A `ResizeObserver` observes the rendered popup element; its callback computes `calculateHorizontalClampOffset` and applies it via `setHorizontalOffset`. No measurement happens synchronously in the effect body or during render (see Key Architectural Decisions).
- `onClickOutside`, when provided, registers a `mousedown` listener on `document` and fires when the click target falls outside the popup element. `FloatingToolbar` and `MentionTypeaheadPlugin` omit this prop — they own their own dismissal logic (selection state, Lexical's typeahead state).
- Edge case: `getAnchorRect` returning `null` after previously returning non-null (e.g., a scroll event captured at a moment a consumer's underlying anchor became invalid) simply renders `null` on the next tick — no special handling required.

**UI / Visual**:
- `.editor-popup`: `position: fixed; transform: translateX(-50%) translateY(-100%); z-index: var(--most-front); animation: editorPopupFadeIn var(--transition-fast) ease-in-out;` — `translateX(-50%)` centers on the `left` coordinate (anchor's horizontal center plus clamp offset); `translateY(-100%)` places the popup's bottom edge at `top` (the anchor's top edge), and self-adjusts to content height changes with no JS involvement.
- `@keyframes editorPopupFadeIn`: opacity-only fade, `0` to `1` — no transform animation, to avoid colliding with the static `translateX/Y` transform already positioning the element.
- No visual chrome (background, border, padding) — each consumer supplies its own `GlassPanel` or equivalent wrapper as `children`.

### Test coverage

`calculateHorizontalClampOffset.test.ts` covers the four distinct code paths named in the Key Architectural Decisions section: no clamping needed, left-edge overflow, right-edge overflow, and the exact boundary case (`centerX - halfWidth === edgePadding`, which must not trigger clamping since the condition is strict `<`).

`EditorPopup.tsx` itself has no test file — it is a React component (returns JSX), which CLAUDE.md's Testing Policy forbids unit-testing. `FloatingToolbar.tsx`, `EmbeddedLinkPlugin.tsx`, and `MentionTypeaheadPlugin.tsx` (SF2–SF4) are components for the same reason and have no test files either.

---

## SF2: `FloatingToolbar` migration

Replaces mouse-position-driven, always-visible-during-drag positioning with mouseup-gated visibility anchored to the selection range.

### Files affected

```text
Modified:
  src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.tsx
  src/components/TextEditor/components/FloatingToolBar/FloatingToolbar.css
```

Implementation status: complete and verified, commit `0bbb916`.

### Frontend

**Purpose** — the toolbar must appear only once a text selection is finalized (mouseup), not continuously while the user is still dragging to select, and must stay visually anchored to that selection rather than trailing the mouse cursor.

**Behavior**:
- `selectionRangeRef` (a `Range | null`) and `isMouseDownRef` (a plain mutable ref, not React state — no re-render needed for it) replace the removed `cursorPosition`/`position`/`selected`/`isFocused` state.
- A single `useEffect` (deps `[editor]`) registers: `mousedown`/`mouseup` listeners on the editor root and `document` respectively (tracking drag state and triggering visibility evaluation on release), a `blur` listener on the editor root (closes the toolbar unless link-input mode is active), and Lexical's `SELECTION_CHANGE_COMMAND` (re-evaluates visibility on every selection change, but skips evaluation while `isMouseDownRef.current` is `true` — this is what suppresses the during-drag appearance).
- `updateToolbarVisibility` (local to that effect) reads `window.getSelection()` directly; a non-collapsed selection sets `selectionRangeRef.current` and opens the toolbar, anything else closes it.
- Keyboard-driven selection (e.g., Shift+Arrow) is unaffected by the mouseup gate — `isMouseDownRef.current` is `false` in that case, so `SELECTION_CHANGE_COMMAND` opens the toolbar immediately, matching the existing behavior for non-mouse selection.
- `isLinkInputMode`/`isLinkInputModeRef`/`enterLinkInputMode`/`exitLinkInputMode` are unchanged from the prior implementation.

**UI / Visual**:
- The portal and all positioning CSS (`position`, `transform`, `z-index`, `animation`, the `--toolbar-final-position` custom property) move out of `FloatingToolbar.css` into `EditorPopup.css`. `.floating-toolbar` retains only its content-box styling: `display: flex`, `gap`, `background-color`, `padding`, `border-radius`, `width: max-content`.
- `onMouseDown` (conditionally `undefined` in link-input mode, otherwise `e.preventDefault()`) moves from the removed portal `<div>` to the `.floating-toolbar` content `<div>`, which is now `EditorPopup`'s child rather than the portaled element itself.

---

## SF3: `EmbeddedLinkPlugin` migration

Replaces click-coordinate positioning with anchoring to the clicked link's own DOM element.

### Files affected

```text
Modified:
  src/components/TextEditor/plugins/EmbeddedLinkPlugin/EmbeddedLinkPlugin.tsx
  src/components/TextEditor/plugins/EmbeddedLinkPlugin/EmbeddedLinkPlugin.css
```

Implementation status: complete and verified, commit `3ade72f`.

### Frontend

**Purpose** — the link popup must be centered above the link itself, not above wherever inside the link text the user happened to click, and must scroll-glue and viewport-clamp consistently with the other two popups.

**Behavior**:
- `linkPopup: { url, x, y } | null` state is replaced by `linkUrl: string | null` plus `linkElementRef: Element | null` (a ref, not state — the element reference doesn't need to trigger re-renders).
- The `CLICK_COMMAND` handler resolves the link's DOM element via `(event.target as Element).closest('a')` and stores it in `linkElementRef.current` alongside setting `linkUrl`.
- The dedicated `popupRef` + `mousedown` outside-click `useEffect` is removed; `onClickOutside={() => setLinkUrl(null)}` passed to `EditorPopup` replaces it.
- `PASTE_COMMAND` handling is unchanged.

**UI / Visual**:
- The `link-popup-wrapper` div (the old portal target, styled via `.link-popup-wrapper { position: absolute; z-index: var(--most-front); }`) is removed — `EditorPopup` is now the portaled wrapper. `GlassPanel className='link-popup'` renders directly as `EditorPopup`'s child. The now-unused `.link-popup-wrapper` CSS rule is deleted from `EmbeddedLinkPlugin.css`.
- `.link-popup` and `.link-popup-url` styling is unchanged.

---

## SF4: `MentionTypeaheadPlugin` migration

Replaces Lexical's anchor-element portal target with `EditorPopup`, while keeping `LexicalTypeaheadMenuPlugin` for all keyboard/selection logic.

### Files affected

```text
Modified:
  src/components/TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx
  src/components/TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.css
```

Implementation status: complete and verified, commit `d83169b`.

### Frontend

**Purpose** — the mention typeahead must follow the same positioning, scroll-gluing, and viewport-clamping rules as the other two popups, while keeping Lexical's typeahead state machine (option highlighting, keyboard navigation, query matching) entirely intact.

**Behavior**:
- `menuRenderFn`'s early-return guard (`anchorElementRef.current === null || menuOptions.length === 0`) is unchanged.
- The `createPortal(content, anchorElementRef.current)` call is replaced by `<EditorPopup getAnchorRect={() => anchorElementRef.current?.getBoundingClientRect() ?? null}>content</EditorPopup>`. `EditorPopup` performs its own portal to `document.body` internally.
- `onQueryChange`, `onSelectOption`, `triggerFn`, and the `MentionMenuOption` class are unchanged.
- The list item rendering (`<li>` per option, `--rt-mention-typeahead-item-color` runtime custom property, click/hover handlers) is unchanged — only its wrapping changed, from a raw portal to `EditorPopup`.

**UI / Visual**:
- `.mention-typeahead-popup`'s `z-index: 1000` is removed — it was already redundant with the ancestor `.editor-popup`'s `z-index: var(--most-front)` (same numeric value, applied one level up in the DOM) and was a pre-existing raw-integer violation. `GlassPanel`/`CustomScrollArea`/list styling is otherwise unchanged.
- Content-height changes (as search results load) require no explicit handling — `EditorPopup`'s `translateY(-100%)` placement is height-agnostic by construction, and `.mention-typeahead-content-container`'s existing `max-height: var(--mention-popup-max-height)` bounds growth.

---

## Outstanding Work

Two items are not implemented. Neither is blocked on a decision — both are precisely specified below and in CLAUDE.md Impact; they just haven't been applied yet.

1. **Inline comment in `EditorPopup.tsx` explaining the scroll-anchoring choice.** The Key Architectural Decisions entry "Scroll anchoring re-measures live, it does not freeze document coordinates" documents *why* `position: fixed` + a capture-phase scroll listener was chosen over the simpler frozen-document-coordinate approach the architect brief originally proposed. That rationale is not obvious from reading the component alone (it depends on knowing `CustomScrollArea` exists and that `body` disables window scrolling) and currently lives only in this spec, which is not a permanent artifact. Add a short comment at the `scroll` listener registration in `EditorPopup.tsx` stating that window-level scrolling is disabled app-wide and `CustomScrollArea` is the real scroll container, so the anchor rect must be re-read rather than frozen.
2. **The two `app/src/CLAUDE.md` edits listed under CLAUDE.md Impact below** — the stale `--toolbar-final-position` example and the `useLayoutEffect`-vs-`react-hooks` v7 note. Not yet applied to that file.

## CLAUDE.md Impact

**`app/src/CLAUDE.md`**, "Static CSS custom properties" section: the example `- ✅ \`--toolbar-final-position: 8px\` (set in CSS), consumed via \`var(--toolbar-final-position)\` within the same component` named a real property in `FloatingToolBar/FloatingToolbar.css` that SF2 removes (the toolbar's positioning, including this custom property, moved to `EditorPopup.css`, which uses no static custom properties of its own). Replace this bullet with a different currently-real example, or generalize it to an illustrative name that does not reference a specific file.

**`app/src/CLAUDE.md`**, "Coding Style" section, the `useLayoutEffect` bullet: the documented pattern (read layout geometry, apply a state update synchronously in the same effect to avoid a visible flash) is now in tension with `react-hooks/set-state-in-effect` and `react-hooks/refs` — both active via `eslint-plugin-react-hooks@^7.0.1`'s `recommended` config in `eslint.config.js`. Add a note: when the layout-synchronous correction requires a `setState` call and the active ESLint config flags the synchronous pattern, defer the `setState` call into a subscription callback (e.g., a `ResizeObserver` registered in the effect) rather than calling it at the effect's top level — accepting a brief post-paint correction in exchange for ESLint compliance. Cite `src/components/TextEditor/components/EditorPopup/EditorPopup.tsx`'s viewport-clamping effect as the canonical example.

**Other impact**: none. No new layer, directory convention, or module shape beyond the existing sub-component-at-nearest-shared-ancestor pattern (already documented) is introduced. No impact to `app/docs/_product/domain-scaffold.md` — no new domain entity or ambient system is involved.
