# SF3 — Gutter click plugin

Makes the gutter clickable. Clicking anywhere in a toggle's gutter column flips its collapsed state, in both editable and read-only editors. After this sub-feature a toggle that exists in a document can be opened and closed; nothing can create one yet.

## Files affected

**New:**

- `app/src/components/TextEditor/plugins/ToggleGutterPlugin/ToggleGutterPlugin.ts`

**Modified:**

- `app/src/components/TextEditor/plugins/index.ts` — add the export
- `app/src/components/TextEditor/TextEditor.tsx` — render the plugin unconditionally

## Frontend

### `plugins/ToggleGutterPlugin/ToggleGutterPlugin.ts`

**Purpose** — Owns the only click handling for toggles. Attaches one delegated listener to the editor root and translates a gutter click into a collapsed-state change on the corresponding `ToggleNode`.

**Behavior**

Follows `CheckboxReadOnlyPlugin`'s shape: a component returning `null`, taking the editor from `useLexicalComposerContext()`, registering a `click` listener on `editor.getRootElement()` inside a `useEffect` keyed on `[editor]`, and removing it in the cleanup function.

It differs from `CheckboxReadOnlyPlugin` in one important way, and the difference is deliberate: this plugin is **not** read-only-only. `CheckboxReadOnlyPlugin` exists solely to fill the gap Lexical's own `CheckListPlugin` leaves when the editor is non-editable. No built-in plugin handles toggles in either mode, so this one is the sole handler for both and is registered unconditionally. A read-only twin, or registration inside the `!readOnly` group, would produce either dead toggles in one mode or a double toggle in the other.

Click resolution, in order:

1. Narrow `event.target` to `HTMLElement` — bail otherwise.
2. Find the clicked gutter with `closest(`.`${TOGGLE_GUTTER_CLASS}`)`, importing the constant from `../../TextEditor.constants`. Bail when null. With nested toggles this returns the innermost gutter containing the click, which is the correct target: a parent's gutter is a sibling column beside the child's content, never an ancestor of it, so it cannot be selected by accident.
3. Take the gutter's `parentElement` — the toggle root element that carries Lexical's node key. Bail when null.
4. Call `event.preventDefault()` to stop the click from placing the caret.
5. Inside `editor.update()`, resolve the node with `$getNearestNodeFromDOMNode` on the root element, guard it with `$isToggleNode`, and call `toggleCollapsed()`.

The `$isToggleNode` guard is required rather than optional. Without it, a DOM structure change that made the resolution return a different node would silently mutate the wrong node instead of doing nothing.

No `helper/` directory. The resolution above is a single linear sequence of guards with no derived value worth isolating, and extracting it would produce a function whose only assertions would restate the guards.

This plugin does not read or write React state, so it is not affected by the state-derivation rules — all state lives in the Lexical document.

**UI / Visual**

None. This plugin renders `null` and contributes no DOM. The gutter's hover feedback and cursor come from SF2's CSS; the collapsed appearance follows automatically from the modifier class SF1's `updateDOM` applies once `toggleCollapsed()` runs.

### `plugins/index.ts`

Add `export { ToggleGutterPlugin } from './ToggleGutterPlugin/ToggleGutterPlugin';`.

This barrel already uses explicit named exports throughout and requires no other change — verified against the grouping-barrel convention, not inferred from its current contents.

### `TextEditor.tsx`

Render `<ToggleGutterPlugin />` unconditionally, alongside `<ExternalValueSyncPlugin value={value} />` rather than inside either the `!readOnly` group or the `readOnly` line. Import it from `./plugins`, extending the existing multi-name import from that barrel.

Nothing else in this file changes in this sub-feature. The file was read in full and checked for CLAUDE.md violations; none were found, so no cleanup task attaches here.

## Tests

None. No helper or util function is added — see the no-`helper/`-directory decision above. `ToggleGutterPlugin` itself is a React component, and the Testing Policy in `app/src/CLAUDE.md` forbids unit tests for components.
