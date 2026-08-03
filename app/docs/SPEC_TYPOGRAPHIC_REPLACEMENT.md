# Typographic Replacement

Typing `->`, `<-`, or `--` produces `→`, `←`, or `—` as the user types, in the rich-text editor and in the app's name, search, and delete-confirm input fields. The set of replacements is defined in one place so more can be added later.

## Progress tracker

- Sub-feature 1: Pre-existing convention cleanup — clear the existing violations in the three files later sub-features edit, before any behavior change touches them
- Sub-feature 2: Rule table and editor replacement — define the canonical replacement rules and apply them in the Lexical editor via the already-mounted markdown shortcut plugin
- Sub-feature 3: Input field replacement — apply the same rules to `SyncedInput`, `SearchInput`, and `DeleteDialog` through one shared hook that also restores the caret

## Key Architectural Decisions

### The rule table is shared; the mechanism that applies it is not

A single `TYPOGRAPHIC_RULES` table in `src/util/` is the only definition of which pattern becomes which glyph. Both hosts read it, and neither shares application code with the other. Lexical owns node splitting, caret placement, and undo integration for the editor; a controlled DOM input owns none of those and must do its own string splice and caret restoration. The two sites serve the same concern at the level of *which* replacements exist and different concerns at the level of *how* a replacement is applied, so `app/CLAUDE.md`'s "Separation of concerns over DRY" resolves to extracting the data and leaving the two mechanisms independent. Adding a fourth replacement is one table entry and no mechanism change.

### Each rule owns a full end-anchored `RegExp`, never a literal string pair

A rule is `{ trigger: string; pattern: RegExp; replacement: string }`. Modelling rules as literal from/to string pairs cannot express the context sensitivity the replacements actually need, and the table is expected to grow. `pattern` must be anchored to the end of the string with `$` and must not carry the `g` or `y` flag: the editor host evaluates it via `String.prototype.match` and the input host via `RegExp.prototype.exec`, and a `g`-flagged regex makes `exec` stateful across calls through `lastIndex`, producing intermittent misses.

### Matching is first-match-wins against the text before the caret, in both hosts

Both hosts select a rule by testing patterns in table order against the text from the block start up to the caret, and stop at the first match. This is not a choice — it is the semantics Lexical's markdown shortcut runner already implements, and the input host mirrors it so the two surfaces behave identically. Because every pattern is end-anchored and ends with its own trigger character, a pattern can only match when the last character before the caret equals that rule's `trigger`; the editor host uses `trigger` as an index key, and the input host does not need it at runtime. The four rules shipped here have pairwise disjoint patterns, so their relative order does not change any outcome today — order becomes load-bearing as soon as a rule is added whose pattern can match a suffix another rule also matches, and the table must then list the more specific pattern first.

### `-->` is reached by a composition rule, not by ordering

`--` fires the instant the second hyphen is typed, so by the time a `>` arrives the text already reads `—>`, and no rule matching the literal three characters `-->` can ever see them. The table therefore carries a fourth rule matching `—>` (em dash followed by `>`) and producing `→`. Typing `-`, `-`, `>` runs `--` → `—` on the second keystroke and `—>` → `→` on the third.

### Replacement in the editor mutates the matched node in place

Lexical hands `replace` a `TextNode` already split to exactly the matched range. Calling `setTextContent` on that node preserves its identity, and therefore its format bits — a `->` typed inside bold text yields a bold `→`. Constructing a fresh `TextNode` and replacing the matched one drops those bits. This is a correctness contract, not a style preference.

### Conversion fires only on single-character insertion, in both hosts

The editor host converts only while typing at the caret and never on paste, because Lexical routes pasted content through markdown import rather than through the shortcut runner. The input host has no equivalent boundary — a paste fires `onChange` exactly like a keystroke — so it reproduces the boundary explicitly by comparing the incoming value's length against the previous value's length and converting only when exactly one character was added. Without this gate, pasting any text ending in `->`, `--`, or `—>` would silently rewrite its tail. The comparison is made against the last value the hook itself saw; when an external update changes the field's value without passing through the hook (a peer sync adopted by `useSyncedInputValue`), the very next keystroke fails the length comparison and does not convert, and the keystroke after it behaves normally. That one-keystroke gap is accepted: its failure mode is a conversion that does not happen, never a wrong conversion.

### `DeleteDialog`'s input becomes controlled

`DeleteDialog` currently renders an uncontrolled `Input` — it passes `onChange` and `placeholder` but no `value`. An uncontrolled input cannot display a transformed value: the DOM would keep the literal characters while the change handler received the converted string. The input therefore gains local state bound to `value`. This is required, not incidental: `DeleteDialog` builds `confirmText` from the entity name and gates deletion on exact equality, so once names can contain `→`, a confirm field that cannot produce `→` makes the entity undeletable through the dialog.

### `PairDeviceDialog` and `LinkInput` are deliberately excluded

Both render `Input` and both must keep literal characters. `PairDeviceDialog`'s field holds a pairing code; `LinkInput`'s holds a URL, where a `--` or `->` inside a path or query string would be corrupted. Neither is wired to the hook, and neither is touched by this spec.

### Search conversion is forward-looking and leaves existing values behind

`SearchInput` converts its term so that a typed `->` matches names stored with `→`. `allTermsMatchItem` performs a raw `toLowerCase()` substring test with no normalization on either side, so any name saved before this feature ships with a literal `->` stops being findable by typing `->`. No migration is performed and no matching logic changes; this is an accepted consequence of converting the search term.

## Sub-feature 1: Pre-existing convention cleanup

`SearchInput.tsx`, `DeleteDialog.tsx`, and `src/hooks/index.ts` are all edited by later sub-features and all carry pre-existing convention violations. `app/CLAUDE.md`'s "Fix violations in files you touch" makes those violations mandatory to fix once those files are opened; its dedicated-preceding-commit exception puts them here rather than inside the behavior commits, which they would otherwise dominate. This sub-feature changes no behavior. It is appearance-neutral except for the search field's clear button, whose treatment deliberately changes — see its entry below.

### Files affected

- `Modified:` `app/src/components/SearchInput/SearchInput.tsx` — replace the bare `<input>` with the `Input` primitive and the bare `<button>` with `ClickableIcon`; convert the props type to the `FCProps<Props>` form
- `Modified:` `app/src/components/SearchInput/SearchInput.css` — reconcile with the `.input`, `.action-container`, and `.clickable-icon` classes that now also apply
- `Modified:` `app/src/components/DeleteDialog/DeleteDialog.tsx` — convert the props type to the `FCProps<Props>` form; move the two computed inline style values to a CSS custom property
- `Modified:` `app/src/components/DeleteDialog/DeleteDialog.css` — receive the two moved declarations
- `Modified:` `app/src/hooks/index.ts` — import `useListFilter` through its module barrel instead of the double-name file path
- `New:` `app/src/hooks/useListFilter/index.ts` — required module directory barrel

### Frontend

**`SearchInput.tsx`**

- **Purpose** — the list search field used by `SortableList`. Unchanged.
- **Behavior** — unchanged. The debounce, the clear action, and the `onSearch` contract stay exactly as they are; only the elements rendering them change.
- **UI / Visual** — three changes. First, the inner `<input>` becomes `<Input className='search-input-field' />`; the field's appearance must be identical before and after. Drop its current `type='text'` rather than forwarding it — `text` is `<input>`'s default type and `app/src/CLAUDE.md` — Redundant HTML attributes bars writing an attribute whose value matches the browser default. Second, the clear `<button>` becomes `<ClickableIcon icon={<XIcon />} label='Clear search' className='search-input-clear' type='button' onClick={handleClear} />`; this replaces the existing `aria-label='Clear search'`, since `ActionContainer` requires a `label` prop and applies it as `aria-label`, and it keeps `type='button'` because `<button>`'s default type is `submit`, making the attribute non-redundant. `SearchInput.tsx:58` is currently the only bare `<button>` in `src/` outside `ActionContainer` itself, which is the sanctioned primitive; `ClickableIcon` is the established icon-button idiom with seven existing consumers. Third, the inline `SearchInputProps` type becomes a named `type Props` with the component typed `FCProps<Props>` per `app/src/CLAUDE.md` — Props pattern case 3; the three fields and their defaults are unchanged. `FCProps` is imported from `@/types`. Do not remove `placeholder`'s `'Search...'` default or `debounceMs`'s `300` default. Both `Input` and `ClickableIcon` are imported by direct relative path — `../Input/Input` and `../ClickableIcon/ClickableIcon` — never through `@/components`, which is circular from inside `src/components/` per `app/src/CLAUDE.md` — Barrel Files.

**`SearchInput.css`**

`Input` renders `cn('input', className)`, so the field element now carries both `input` and `search-input-field`. `.input` and the current `.search-input-field` block declare the same values for `width`, `font-size`, `font-family`, `background-color`, `padding`, and `margin`, and the same `::placeholder` colour — delete those declarations from `.search-input-field` rather than leaving duplicated values in two files. `.input` additionally sets `color: var(--color-fb)`, `line-height: 0`, `border-bottom: 1px solid transparent`, a `:hover` recolour to `var(--color-primary)` (including `::placeholder`), and a `:focus` recolour to `var(--color-fg)` — all of which are correct for the header name fields `Input` was written for and wrong for a search field. Override them with a two-class selector so the outcome does not depend on stylesheet order:

```css
/* The shared .input primitive class also applies to this element; these rules restore the search field's own colour and line-height, which .input styles for header name fields. */
.search-input .search-input-field {
  color: var(--color-text);
  line-height: normal;
  border-bottom: none;
}

.search-input .search-input-field:hover,
.search-input .search-input-field:focus {
  color: var(--color-text);
}

.search-input .search-input-field:hover::placeholder {
  color: var(--color-text-muted);
}
```

Delete the now-empty or fully-superseded `.search-input-field`, `.search-input-field:focus`, and `.search-input-field::placeholder` blocks.

The clear button now carries `action-container` and `clickable-icon` in addition to `search-input-clear`. Between them those two classes already supply `cursor: pointer`, `background-color: transparent`, `border: none`, `flex-shrink: 0`, and a colour transition — delete all five from `.search-input-clear` rather than duplicating them. `.clickable-icon` also supplies a resting colour of `var(--color-primary)` and a hover treatment of `var(--color-fg)` plus `scale: 1.1`, where the button currently rests at `var(--color-text-muted)` and hovers to `var(--color-text)` with no scale. Adopt `.clickable-icon`'s treatment as-is and delete `.search-input-clear`'s own `color` and `:hover` rules: the clear button then matches every other icon button in the app, and no override selector is needed. This is a deliberate, visible change — the clear icon becomes primary-coloured at rest and grows slightly on hover. Retain only the layout declarations `.clickable-icon` does not provide:

```css
.search-input-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
```

Leave the `.search-input-clear svg` sizing rule as it is, and leave `.search-input` and `.search-input-icon` untouched.

**`DeleteDialog.tsx` and `DeleteDialog.css`**

- **Purpose** — unchanged.
- **Behavior** — unchanged. `handleInputChange`, `confirmText`, the intensity calculation, and the `oneClickConfirm` branch all keep their current logic.
- **UI / Visual** — the rendered result must be identical. Two fixes. First, rename `DeleteDialogProps` to `Props` and type the component `FCProps<Props>` per `app/src/CLAUDE.md` — Props pattern case 3; the three fields are unchanged. Second, `intensity` is a JavaScript-computed value currently applied as two raw `boxShadow` and `background` strings in an inline `style` prop, which `app/src/CLAUDE.md` — Static CSS custom properties bars. Pass it instead as a single custom property — `style={{ '--delete-dialog-intensity': intensity } as React.CSSProperties}` — and move both declarations into `.delete-dialog` in `DeleteDialog.css`, reading the property through `calc()`:

```css
.delete-dialog {
  box-shadow: inset 0 calc(var(--delete-dialog-intensity) * -5px)
    calc(var(--delete-dialog-intensity) * 10px)
    rgb(var(--color-danger-hover-rgb), calc(var(--delete-dialog-intensity) / 2));
  background: radial-gradient(
    ellipse 50% 80% at 50% 100%,
    rgb(var(--color-danger-hover-rgb), var(--delete-dialog-intensity)),
    transparent
  );
}
```

  The prefix is `--delete-dialog-` with no `rt` segment, because the value is JavaScript-computed rather than DB-sourced. Add these declarations to the existing `.delete-dialog` block rather than creating a second one, and leave every other rule in the file untouched. The pixel and percentage literals move verbatim out of the TypeScript template strings; they arrive in the stylesheet without `/* one-off */` annotations, which is the sanctioned deferred state under `app/src/CLAUDE.md` — report them to the user at the end of the task so they can decide between a token and an annotation, and do not block the commit on it.

**`src/hooks/index.ts` and `useListFilter/index.ts`**

`src/hooks/index.ts` currently reads `export { useListFilter } from './useListFilter/useListFilter';` — the double-name anti-pattern named in `app/CLAUDE.md` — Directory Structure. Its stated exemption covers only the case where no barrel exists *and* a grouping barrel would be circular; a module barrel inside `useListFilter/` is not circular here, so the exemption does not apply and the barrel is required by the module-directory rule. Create `app/src/hooks/useListFilter/index.ts` containing the single explicit named export `export { useListFilter } from './useListFilter';`, and change the line in `src/hooks/index.ts` to import from `'./useListFilter'`. Leave every other line in `src/hooks/index.ts` unchanged, and do not modify `useListFilter.ts` or anything under `useListFilter/helper/`.

### Tests

None. No helper or util function is added or changed; `SearchInput` and `DeleteDialog` are React components and are barred from unit tests by `app/src/CLAUDE.md` — Testing Policy.

`[MANUAL-VERIFY]` Open a list screen and confirm the search field's resting, hover, and focus appearance, its placeholder colour, and its vertical alignment are unchanged from before this sub-feature. Confirm the clear button still appears only when the field is non-empty, still clears the field and fires a search with the empty string, and now renders in the app's standard icon-button colour with the standard hover growth. Open a delete dialog and type the confirm text one character at a time, confirming the red glow and inset shadow build up exactly as before and that completing the text still deletes.

## Sub-feature 2: Rule table and editor replacement

Defines the canonical rule table and applies it inside the Lexical editor by extending the `MarkdownShortcutPlugin` instance already mounted in `TextEditor.tsx`.

### Files affected

- `New:` `app/src/util/typographicRules.ts` — the `TYPOGRAPHIC_RULES` table
- `Modified:` `app/src/util/index.ts` — add the explicit named export for `TYPOGRAPHIC_RULES`; grouping barrel, explicit named exports only, `export *` is banned here
- `New:` `app/src/components/TextEditor/typographicTransformers.ts` — maps the table to Lexical transformers
- `Modified:` `app/src/components/TextEditor/TextEditor.tsx` — append the transformers to the existing `MarkdownShortcutPlugin` `transformers` array

### Frontend

**`src/util/typographicRules.ts`**

- **Purpose** — the single definition of which typed pattern becomes which glyph, read by both hosts.
- **Behavior** — exports `TYPOGRAPHIC_RULES`, an array of `{ trigger, pattern, replacement }`. Declare the element type locally in this file and do not export it: no consumer annotates with it, and an exported type with no importer is dead code under `app/CLAUDE.md` — Re-derive types after every refactor. Four entries, in this order:

  | trigger | pattern | replacement | note |
  | --- | --- | --- | --- |
  | `>` | `/—>$/` | `→` | em dash then `>`; makes typing `-->` reach `→` |
  | `>` | `/->$/` | `→` | hyphen then `>` |
  | `-` | `/<-$/` | `←` | |
  | `-` | `/--$/` | `—` | |

  Every `pattern` is end-anchored and carries no flags. The em dash in the first pattern and in the fourth rule's `replacement` is U+2014; the arrows are U+2192 and U+2190.
- **UI / Visual** — none; this file renders nothing.

**`src/components/TextEditor/typographicTransformers.ts`**

- **Purpose** — adapts `TYPOGRAPHIC_RULES` to the shape Lexical's markdown shortcut runner consumes. Placed as a sibling of `TextEditor.tsx` per `app/src/CLAUDE.md` — Constants, Trigger 2: it is a self-contained supporting definition rather than render or state logic, following the existing `textFormattingConfig.ts` precedent. It is not named `TextEditor.constants.ts` because its content is derived config, not a constant.
- **Behavior** — exports `TYPOGRAPHIC_TRANSFORMERS`, typed `TextMatchTransformer[]`, produced by mapping `TYPOGRAPHIC_RULES`. Each element sets `type: 'text-match'`, `dependencies: []`, `trigger` and `regExp` from the rule, and a `replace` callback whose entire body is `node.setTextContent(rule.replacement);`. `dependencies: []` is correct: the runner iterates that array only to assert each listed node class is registered on the editor, and these rules depend on no custom node. Declare `replace` with only its first parameter — the runner passes a second `match` argument that this implementation does not read, and `noUnusedParameters` rejects an unused declared parameter. Import `TextMatchTransformer` from `@lexical/markdown` and `TYPOGRAPHIC_RULES` from `@/util`, both as plain imports, matching `TextEditor.tsx`'s existing handling of type-only imports from `lexical`.
- **UI / Visual** — none.

**`TextEditor.tsx`**

- **Purpose** — unchanged.
- **Behavior** — the sole change is to the `MarkdownShortcutPlugin` element: spread `TYPOGRAPHIC_TRANSFORMERS` into its `transformers` array after the three existing list transformers, so the array reads `[UNORDERED_LIST, ORDERED_LIST, CHECK_LIST, ...TYPOGRAPHIC_TRANSFORMERS]`. Add the import from `./typographicTransformers`. Change nothing else in this file — not the `nodes` array, not the theme, not any other plugin. `MarkdownShortcutPlugin` is already rendered unconditionally, including when `readOnly` is true; that is existing behavior and is left as it is, since a non-editable editor receives no keystrokes for the runner to act on.
- **UI / Visual** — no layout or styling change. The visible effect is that typing an arrow or double-hyphen sequence in any editor body substitutes the glyph in place.

### Tests

None. `typographicRules.ts` exports data rather than a function, and `typographicTransformers.ts` is derived static config — neither is a helper or util *function*, so `app/src/CLAUDE.md` — Testing Policy does not require coverage for either. The replacement logic these rules drive inside the editor is Lexical's own runner, not first-party code. The same table's behavior under first-party logic is covered by SF3's helper tests.

`[MANUAL-VERIFY]` In an editor body, type `->`, `<-`, `--`, and `-->` and confirm they render `→`, `←`, `—`, and `→`. Type `->` inside a bold run and confirm the resulting arrow is still bold. Press Ctrl+Z immediately after a substitution and confirm the literal characters return. Paste a string ending in `-->` and confirm it is not rewritten.

## Sub-feature 3: Input field replacement

Applies the same rule table to `SyncedInput`, `SearchInput`, and `DeleteDialog` through one hook that owns the caret restoration each substitution requires.

### Files affected

- `New:` `app/src/hooks/useTypographicInput/useTypographicInput.ts` — the hook
- `New:` `app/src/hooks/useTypographicInput/index.ts` — module directory barrel, single explicit named export
- `New:` `app/src/hooks/useTypographicInput/helper/applyTypographicRuleAtCaret.ts` — the pure substitution function
- `New:` `app/src/hooks/useTypographicInput/helper/index.ts` — grouping barrel, explicit named exports only
- `New:` `app/src/hooks/useTypographicInput/helper/__tests__/applyTypographicRuleAtCaret.test.ts`
- `Modified:` `app/src/hooks/index.ts` — add the explicit named export for `useTypographicInput`
- `Modified:` `app/src/components/SyncedInput/SyncedInput.tsx` — route `onChange` through the hook; add `'ref'` to the props `Omit`
- `Modified:` `app/src/components/SearchInput/SearchInput.tsx` — route `onChange` through the hook
- `Modified:` `app/src/components/DeleteDialog/DeleteDialog.tsx` — route `onChange` through the hook; make the input controlled

### Frontend

**`helper/applyTypographicRuleAtCaret.ts`**

- **Purpose** — the entire decision of whether a keystroke triggers a substitution, and what the resulting value and caret are. Pure and fully testable, so the hook holds only refs and wiring.
- **Behavior** — signature `(value: string, previousValue: string, caret: number | null) => { value: string; caret: number } | null`, returning `null` when no substitution applies. Declare the success shape as a local type in this file; do not export it, as the hook consumes the value structurally. Returning `null` rather than `undefined` follows `app/CLAUDE.md` — never use `undefined` as a value in business logic. The function returns `null` when `caret` is `null`, when `value.length !== previousValue.length + 1`, or when no rule's `pattern` matches `value.slice(0, caret)`. On a match it returns the value with the matched range replaced by `replacement` and the text after `caret` preserved, and the caret positioned immediately after the inserted glyph. Iterate `TYPOGRAPHIC_RULES` in order and return on the first match — this consumes the symbol introduced in SF2. `caret` is `number | null` because `HTMLInputElement.selectionStart` is declared nullable in `lib.dom.d.ts`, and `strictTypeChecked` rejects an unnarrowed read.
- **UI / Visual** — none.

**`useTypographicInput.ts`**

- **Purpose** — gives any controlled text input the rule table's behavior, including the caret restoration a substitution requires.
- **Behavior** — signature `(onValueChange: (value: string) => void) => { inputRef, handleChange }`, with the return shape declared as a local named type and not exported, mirroring `useSyncedInputValue`'s existing structure in the same directory. It holds three refs: the input element, typed `useRef<HTMLInputElement | null>(null)` — the explicit type argument is required per `app/CLAUDE.md`, without which TypeScript infers `RefObject<null>`; the last value the hook saw, used as `previousValue`; and a pending caret position. `handleChange` reads the new value and `selectionStart` from the event target, calls the helper, records the new value into the previous-value ref, stores the pending caret when a substitution occurred, and calls `onValueChange` with the substituted value when one occurred and the raw value otherwise. A `useLayoutEffect` with no dependency array consumes the pending caret: it must run before paint because the caret is visible, and a passive effect would show it at the wrong offset for a frame — state that requirement in an inline comment at the effect per `app/src/CLAUDE.md` — Coding Style, which requires more than "avoids flicker". The effect performs no `setState`, so neither `react-hooks/set-state-in-effect` nor `react-hooks/refs` applies to it: verified by running `npx eslint` from `app/` over a disposable file containing exactly this shape — a dependency-array-less `useLayoutEffect` reading and writing two `useRef` values and calling `setSelectionRange` — which reported no diagnostics, with `npx tsc --noEmit` likewise clean under the project's compiler flags. No `useCallback` anywhere in this hook: no consumer reads `handleChange` in a dependency array or passes it to a `React.memo` component, and `app/src/CLAUDE.md` — State Management bars memoizing without such a consumer.
- **UI / Visual** — none.

**`SyncedInput.tsx`**

- **Purpose** — unchanged.
- **Behavior** — keep `useSyncedInputValue` exactly as it is. Add `useTypographicInput`, passing it a callback that calls both `setValue` and `onCommit` with the value it receives — the same pair the current inline `onChange` calls, now taking the hook's value instead of `e.target.value`. Pass `inputRef` as the `Input`'s `ref` and the hook's `handleChange` as its `onChange`. Because `ref` is now hardcoded in the JSX, add `'ref'` to the existing `Omit` in the props type per `app/src/CLAUDE.md`, which requires every prop a wrapper hardcodes to be omitted from a `React.ComponentProps<typeof Parent>`-derived type; without it a caller could pass a `ref` that is silently shadowed. No `forwardRef` is needed anywhere: `HtmlProps<'input'>` already carries `ref` in React 19, and `Input` spreads its rest props onto the element. `ScreensNameInput` derives its props from `ComponentProps<typeof SyncedInput>` and therefore inherits the narrowed `Omit` mechanically; it was checked and requires no edit, and no existing consumer of `SyncedInput` or `ScreensNameInput` passes a `ref`.
- **UI / Visual** — unchanged.

**`SearchInput.tsx`**

- **Purpose** — unchanged.
- **Behavior** — add `useTypographicInput`, passing a callback that calls `setValue` and `debouncedSearch` with the received value — the same pair `handleChange` currently calls. Replace the existing `handleChange` with the hook's, and pass `inputRef` as the `Input`'s `ref`. Leave `handleClear`, the debounce timer, and the unmount cleanup untouched; clearing sets the value to the empty string and never runs through the hook.
- **UI / Visual** — unchanged.

**`DeleteDialog.tsx`**

- **Purpose** — unchanged.
- **Behavior** — the `Input` becomes controlled: add a `useState` holding the typed text and bind it to `value`, alongside the existing `intensity` state. This is required for the substitution to be visible at all — see the Key Architectural Decision "`DeleteDialog`'s input becomes controlled"; an uncontrolled input would keep the literal characters in the DOM while `handleInputChange` received the converted string. Add `useTypographicInput`, passing a callback that sets the new state and calls the existing `handleInputChange` with the same value. Pass `inputRef` as the `Input`'s `ref` and the hook's `handleChange` as its `onChange`. `handleInputChange`, `confirmText`, the intensity calculation, and the `oneClickConfirm` branch are unchanged, as is the `FCProps<Props>` shape SF1 gave this component. No `Omit` is added here: `Props` is a closed case-3 type that inherits nothing from `Input`, so hardcoding `ref` and `onChange` in the JSX shadows nothing a caller could pass. The same reasoning applies to `SearchInput`, whose `Props` SF1 also closed; `SyncedInput` is the only one of the three deriving from `React.ComponentProps<typeof Input>` and therefore the only one needing the `Omit` extended.
- **UI / Visual** — unchanged. The field now displays a value it previously left to the DOM, which is not observable in normal use.

### Tests

`helper/__tests__/applyTypographicRuleAtCaret.test.ts` — one named test per code path the Key Architectural Decisions identify:

- `returns null when the caret is null`
- `returns null when more than one character was inserted` — a paste whose text ends in `-->`, asserting the value is not rewritten
- `returns null when a character was deleted`
- `returns null when no rule matches the text before the caret`
- `replaces "->" with "→" and places the caret after the arrow`
- `replaces "<-" with "←" and places the caret after the arrow`
- `replaces "--" with "—" and places the caret after the em dash`
- `replaces "—>" with "→", the composition step that makes "-->" reachable` — input value `a—>`, previous `a—`, asserting `a→`
- `preserves text after the caret when replacing mid-string` — asserting both the returned value and the returned caret index

There is deliberately no test asserting first-match-wins across two competing rules: the four shipped patterns are pairwise disjoint, so no input makes two of them match, and such a test cannot be written against this table. The `—>` case above is what exercises table order, by depending on the em-dash rule having already fired.

Assertions state the expected glyphs and caret indices literally; these are string outputs, not values derived from a tunable constant, so literal expectations are correct under `app/src/CLAUDE.md` — Testing Policy. No test file is added for the hook or for any of the three components: they are React components and hooks whose behavior is DOM-interaction bound, and the Testing Policy bars component unit tests.

`[MANUAL-VERIFY]` In an entity name field, type `->`, `<-`, `--`, and `-->` and confirm the glyphs appear. Type `-` `-` in the middle of an existing name and confirm the caret stays immediately after the em dash rather than jumping to the end of the field. Paste a name ending in `-->` and confirm it is not rewritten. Give an entity a name containing `→`, then open its delete dialog and confirm typing `DELETE <name>` with `->` produces the arrow and completes the deletion. Confirm the pairing-code field in the device settings dialog and the link URL field in the editor's floating toolbar both still accept `--` and `->` literally.

## CLAUDE.md impact

`app/src/CLAUDE.md`'s Constants section governs extraction only within a single module directory — Trigger 1 places a shared constant at "the smallest directory containing all consumers", and Trigger 2 covers a self-contained supporting definition beside its single consumer. Neither addresses a constant shared by two modules in different `src/` subtrees, which is what `TYPOGRAPHIC_RULES` is: its consumers are `app/src/components/TextEditor/typographicTransformers.ts` and `app/src/hooks/useTypographicInput/helper/applyTypographicRuleAtCaret.ts`, whose smallest containing directory is `src/` itself, and no `src/constants/` directory exists. This spec places it in `app/src/util/`, which the Util vs. Helper Placement section describes only in terms of functions ("A function belongs in `/src/util/` only when both conditions are met"), leaving the placement of a shared non-function value in that directory undocumented [S_1: `app/src/CLAUDE.md` — Constants and Util vs. Helper Placement, read in full; `app/src/util/` contains `className.ts`, `filePicker.ts`, `index.ts`, `__tests__/` — no non-function module present].

`app/src/CLAUDE.md`'s Testing Policy requires tests for "all helper functions (`ComponentName/helper/`) and util functions (`/src/util/`)" and exempts only a helper whose body is DOM/canvas mutation without branching. It does not state whether a module in one of those directories that exports data rather than a function is in scope, which this spec resolves by adding no test for `app/src/util/typographicRules.ts` [S_2: `app/src/CLAUDE.md` — Testing Policy, read in full — no data-module clause present].
