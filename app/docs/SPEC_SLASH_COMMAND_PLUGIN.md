# Slash Command Typeahead Plugin

## Progress tracker

- Sub-feature 1: Slash Command Typeahead Plugin — add a `/`-triggered block-insertion menu to `TextEditor`

## Key Architectural Decisions

### Table infrastructure must be added to `TextEditor.tsx`, not only the plugin

The Table option requires `TableNode`, `TableRowNode`, `TableCellNode` registered in the editor's `nodes` array and `TablePlugin` registered as a sibling plugin. Without these, `editor.dispatchCommand(INSERT_TABLE_COMMAND, ...)` throws at runtime because Lexical cannot reconcile an unregistered node type. `@lexical/table` is present in `node_modules` at `0.46.0` (matching every other `@lexical/*` package) but is **not** listed in `app/package.json` `dependencies` — it currently resolves only as a transitive dependency of `@lexical/react` [S_1: app/node_modules/@lexical/table/package.json:2 — version "0.46.0"; grep '@lexical' app/package.json — `@lexical/table` not found]. It is added as a direct dependency. `TablePlugin` (from `@lexical/react/LexicalTablePlugin`) is registered unconditionally — not gated by `!readOnly` — matching `ListPlugin`/`CheckListPlugin`'s existing placement, because table content created while editable must also reconcile correctly when the same editor state is later rendered read-only elsewhere.

### `SlashCommandOption`'s icon field is named `Icon`, not `icon`

`MenuOption` (the base class, `@lexical/react/LexicalTypeaheadMenuPlugin`) already declares `icon?: JSX.Element` [S_2: app/node_modules/@lexical/react/dist/shared/LexicalMenu.d.ts:37-44]. A subclass field named `icon` typed `LucideIcon` (a component reference, not a rendered element) is not assignable to the base type — TypeScript rejects incompatible property overrides. The field is declared as `Icon` instead, consistent with this codebase's existing destructure-and-rename convention for icon props (e.g. `icon: Icon` in `BaseBtn.tsx`).

### `SlashCommandOption.onSelect` takes `editor: LexicalEditor` as a parameter

The option list is static and declared once at module scope (outside the component), so it cannot close over the `editor` instance returned by `useLexicalComposerContext()` — that hook only runs inside the component body. `onSelect` therefore has the signature `(editor: LexicalEditor) => void`, and `onSelectOption` supplies `editor` at the call site. `textNodeContainingQuery` is not passed to `onSelect` — node removal is handled once, centrally, in `onSelectOption` (see next decision).

### `onSelectOption` performs node removal and the block transformation inside one `editor.update()` call

Verified against Lexical's own `ComponentPickerPlugin` (the upstream reference implementation for this exact feature) [S_3: WebFetch https://raw.githubusercontent.com/facebook/lexical/main/packages/lexical-playground/src/plugins/ComponentPickerPlugin/index.tsx — `onSelectOption` wraps `nodeToRemove?.remove()` and `selectedOption.onSelect(matchingString)` inside a single `editor.update()`]: text-node removal and the option's block transformation must commit as one history entry and operate on consistent selection state. `closeMenu()` runs after the `editor.update()` call (not nested inside it), matching this codebase's own `MentionTypeaheadPlugin.tsx` convention — this is safe because `closeMenu` only touches component state, never editor state.

### List- and table-insertion `onSelect` callbacks use a block body

`editor.dispatchCommand(...)` returns `boolean`. An arrow function typed `(editor: LexicalEditor) => void` that returns this value via a concise expression body trips `@typescript-eslint/no-confusing-void-expression`, active as `error` in the installed `strictTypeChecked` preset with its default options (`ignoreArrowShorthand: false`) [S_4: ran `grep -n "confusing-void\|ignoreArrowShorthand" app/node_modules/@typescript-eslint/eslint-plugin/dist/configs/flat/strict-type-checked.js app/node_modules/@typescript-eslint/eslint-plugin/dist/rules/no-confusing-void-expression.js` — rule present, default `false`, no override in `app/eslint.config.js`]. Heading options already use a block body (`editor.update(() => {...})`); this decision applies to the four dispatch-command-based options (bullet list, numbered list, checklist, table).

### `onQueryChange` uses a bare `return;`, not `return null;`, for its early exit

Per `app/CLAUDE.md`'s void-context rule (a function typed `void` must use a bare `return;` for early exits). `MentionTypeaheadPlugin.tsx` — the cited reference pattern — uses `return null;` in its equivalent branch; that file predates or otherwise violates this convention. It is listed as a read-only reference for this feature, so it is not corrected as part of this spec.

### Conditional item classNames use `cn()`, not a template-literal ternary

`MentionTypeaheadPlugin.tsx`'s `` `mention-typeahead-item${i === selectedIndex ? '...' : ''}` `` pattern predates the `cn()`-for-conditional-classes convention already established elsewhere in the codebase (e.g. `CustomScrollArea.tsx`'s `cn('custom-scrollbar-thumb', !isHovered && ... && 'custom-scrollbar-thumb--hidden', ...)`). The new plugin uses `cn('slash-command-item', i === selectedIndex && 'slash-command-item--selected')`.

### The menu popup does not use `CustomScrollArea`

The Behavioral Specification's "Menu popup" requirements name only `EditorPopup` and `GlassPanel`. `CustomScrollArea` is part of `MentionTypeaheadPlugin`'s existing structure because that plugin's option list is unbounded (live search results). This plugin's option list is static and capped at 7 entries — a scroll container has no content it will ever need to scroll, so it is omitted.

## Sub-feature 1: Slash Command Typeahead Plugin

Adds a `/`-triggered typeahead menu to `TextEditor` for inserting or converting the current block into a heading, list, checklist, or table — without touching `FloatingToolbar`.

### Files affected

- `New: app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.tsx`
- `New: app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.css`
- `Modified: app/src/components/TextEditor/plugins/index.ts` — add barrel export
- `Modified: app/src/components/TextEditor/TextEditor.tsx` — register table nodes, `TablePlugin`, `SlashCommandPlugin`
- `Modified: app/package.json` — add `@lexical/table` as a direct dependency

No test files are affected. `SlashCommandPlugin.tsx` is a React component (returns JSX) and has no `helper/` functions, so per `app/src/CLAUDE.md`'s Testing Policy it must not have unit tests.

### DB / Services / Data Access Layer

None. This feature is entirely frontend/editor-internal.

### Frontend

#### `app/package.json`

Add `"@lexical/table": "^0.46.0",` on its own line, inserted alphabetically between `"@lexical/selection": "^0.46.0",` and `"@lexical/utils": "^0.46.0",`.

#### `app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.tsx`

**Purpose**: Renders a `/`-triggered typeahead menu that inserts headings, lists, a checklist, or a table at the cursor. Mirrors `MentionTypeaheadPlugin`'s structure (a `LexicalTypeaheadMenuPlugin` wired with a `MenuOption` subclass) with a static, non-async option list instead of a debounced search.

**Behavior**: Triggers on `/` at the start of a paragraph or after whitespace (`useBasicTypeaheadTriggerMatch('/', { minLength: 0, allowWhitespace: false })` — a space after `/` closes the menu; matches mid-word, e.g. inside a URL, are excluded by the trigger's own whitespace-or-line-start requirement). Filters the static option list case-insensitively by substring match on `label` as the user types. Zero matches renders nothing (the menu's `menuRenderFn` returns `null`), matching `MentionTypeaheadPlugin`'s handling of the same case. Selecting an option (via click or Enter) removes the `/query` text and applies the option's block transformation in one `editor.update()` call, then closes the menu.

**UI / Visual**: Anchored via `EditorPopup` to the typeahead's anchor element, wrapped in `GlassPanel`. Each row shows a 16px-equivalent (`var(--font-size-base)`) Lucide icon plus the option label. The highlighted/keyboard-selected row gets the `slash-command-item--selected` modifier class; hover triggers `setHighlightedIndex`.

```tsx
import { useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
  TextNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode } from '@lexical/rich-text';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  LucideIcon,
  Table,
} from 'lucide-react';
import { cn } from '@/util';
import './SlashCommandPlugin.css';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { EditorPopup } from '../../components/EditorPopup';

class SlashCommandOption extends MenuOption {
  label: string;
  Icon: LucideIcon;
  onSelect: (editor: LexicalEditor) => void;

  constructor(
    label: string,
    Icon: LucideIcon,
    onSelect: (editor: LexicalEditor) => void,
  ) {
    super(label);
    this.label = label;
    this.Icon = Icon;
    this.onSelect = onSelect;
  }
}

const SLASH_COMMAND_OPTIONS: SlashCommandOption[] = [
  new SlashCommandOption('Heading 1', Heading1, (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode('h1'));
      }
    });
  }),
  new SlashCommandOption('Heading 2', Heading2, (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode('h2'));
      }
    });
  }),
  new SlashCommandOption('Heading 3', Heading3, (editor) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode('h3'));
      }
    });
  }),
  new SlashCommandOption('Bullet list', List, (editor) => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  }),
  new SlashCommandOption('Numbered list', ListOrdered, (editor) => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  }),
  new SlashCommandOption('Checklist', ListChecks, (editor) => {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  }),
  new SlashCommandOption('Table', Table, (editor) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3' });
  }),
];

export const SlashCommandPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [options, setOptions] = useState<SlashCommandOption[]>(
    SLASH_COMMAND_OPTIONS,
  );

  const triggerFn = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
    allowWhitespace: false,
  });

  const onQueryChange = useCallback((matchingString: string | null) => {
    if (matchingString === null) {
      setOptions([]);
      return;
    }
    const query = matchingString.toLowerCase();
    setOptions(
      SLASH_COMMAND_OPTIONS.filter((option) =>
        option.label.toLowerCase().includes(query),
      ),
    );
  }, []);

  const onSelectOption = useCallback(
    (
      option: SlashCommandOption,
      textNodeContainingQuery: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        textNodeContainingQuery?.remove();
        option.onSelect(editor);
      });
      closeMenu();
    },
    [editor],
  );

  const menuRenderFn = useCallback(
    (
      anchorElementRef: React.RefObject<HTMLElement | null>,
      {
        options: menuOptions,
        selectedIndex,
        selectOptionAndCleanUp,
        setHighlightedIndex,
      }: {
        options: SlashCommandOption[];
        selectedIndex: number | null;
        selectOptionAndCleanUp: (option: SlashCommandOption) => void;
        setHighlightedIndex: (index: number) => void;
      },
    ) => {
      if (anchorElementRef.current === null || menuOptions.length === 0) {
        return null;
      }

      return (
        <EditorPopup
          getAnchorRect={() =>
            anchorElementRef.current?.getBoundingClientRect() ?? null
          }
        >
          <GlassPanel className='slash-command-popup'>
            <ul>
              {menuOptions.map((option, i) => {
                const Icon = option.Icon;
                return (
                  <li
                    key={option.key}
                    ref={(el) => {
                      option.setRefElement(el);
                    }}
                    className={cn(
                      'slash-command-item',
                      i === selectedIndex && 'slash-command-item--selected',
                    )}
                    onClick={() => {
                      selectOptionAndCleanUp(option);
                    }}
                    onMouseEnter={() => {
                      setHighlightedIndex(i);
                    }}
                  >
                    <Icon />
                    <span className='slash-command-item-label'>
                      {option.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </GlassPanel>
        </EditorPopup>
      );
    },
    [],
  );

  return (
    <LexicalTypeaheadMenuPlugin
      options={options}
      onQueryChange={onQueryChange}
      onSelectOption={onSelectOption}
      menuRenderFn={menuRenderFn}
      triggerFn={triggerFn}
    />
  );
};
```

#### `app/src/components/TextEditor/plugins/SlashCommandPlugin/SlashCommandPlugin.css`

```css
.slash-command-popup {
  background: var(--color-surface);
  width: max-content;
  max-width: 200px; /* one-off */
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.slash-command-item {
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.slash-command-item:hover,
.slash-command-item--selected {
  background: var(--color-highlight-bg);
}

.slash-command-item svg {
  width: var(--font-size-base);
  height: var(--font-size-base);
  flex-shrink: 0;
}
```

#### `app/src/components/TextEditor/plugins/index.ts`

Add one line: `export { SlashCommandPlugin } from './SlashCommandPlugin/SlashCommandPlugin';` — placed directly after the existing `MentionTypeaheadPlugin` export line, grouping the two typeahead plugins together.

#### `app/src/components/TextEditor/TextEditor.tsx`

Five insertions into the existing file:

1. After `import { LinkNode } from '@lexical/link';`, add:

   ```ts
   import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
   import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
   ```

2. In the `plugins` import block, add `SlashCommandPlugin` to the destructured list:

   ```ts
   import {
     MentionTypeaheadPlugin,
     CheckboxReadOnlyPlugin,
     EmbeddedLinkPlugin,
     SlashCommandPlugin,
   } from './plugins';
   ```

3. In `initialConfig.nodes`, append the three table nodes:

   ```ts
   nodes: [
     HeadingNode,
     ListNode,
     ListItemNode,
     MentionNode,
     LinkNode,
     TableNode,
     TableRowNode,
     TableCellNode,
   ],
   ```

4. Directly after `<CheckListPlugin />`, add `<TablePlugin />` (unconditional — not gated by `readOnly` — for the same reason `ListPlugin`/`CheckListPlugin` are unconditional: previously-created table content must reconcile correctly in read-only view too).

5. Directly after `{!readOnly && <MentionTypeaheadPlugin />}`, add `{!readOnly && <SlashCommandPlugin />}`.

## CLAUDE.md impact

None. No CLAUDE.md file references any path this spec adds, renames, or removes. This spec introduces no new layer, directory convention, or ambient system — `SlashCommandPlugin` follows the existing typeahead-plugin structural pattern already documented implicitly by `MentionTypeaheadPlugin`'s presence in the codebase. `app/docs/_product/domain-scaffold.md` is unaffected — this feature touches no domain entity, layer, or infrastructure touch point.

Verified external-system facts from this spec are recorded in `.claude/knowledge/lexical.md` per the knowledge base write obligation.
