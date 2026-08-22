# React

## `JSX.IntrinsicElements['input']` already carries `ref`, so `HtmlProps<'input'>` needs no `forwardRef` to accept one

**Verified at:** react 19.2.7, @types/react 19.2.17

**Citation:** [spec-writer_28: app/node_modules/@types/react/index.d.ts:4224 — `input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;`; :2258 — `type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = ClassAttributes<T> & E;`; :307 — `interface ClassAttributes<T> extends RefAttributes<T> {}`; :293-302 — `interface RefAttributes<T> extends Attributes { ref?: Ref<T> | undefined; }`; app/package.json:48 — `"react": "^19.2.7"`]

In React 19 `ref` is an ordinary prop on function components, and the DOM element prop types already declare it: every `JSX.IntrinsicElements[T]` resolves through `DetailedHTMLProps` → `ClassAttributes` → `RefAttributes`, which declares `ref?: Ref<T> | undefined`. This repo's `HtmlProps<T>` alias is defined as `JSX.IntrinsicElements[T]` [app/src/types/htmlProps.type.ts:3-4], so any component typed `FCProps<HtmlProps<'input'>>` that spreads `...props` onto its underlying `<input>` accepts and forwards a `ref` with no `forwardRef` wrapper and no props-type change. `app/src/components/Input/Input.tsx:5-7` is such a component.

## `React.ChangeEvent<HTMLInputElement>.target.selectionStart` is typed `number | null`

**Verified at:** typescript lib.dom.d.ts, loaded via `"lib": ["ESNext", "DOM", "DOM.Iterable"]` in app/tsconfig.json:5

**Citation:** [spec-writer_29: app/node_modules/typescript/lib/lib.dom.d.ts, `interface HTMLInputElement` — `selectionEnd: number | null;` and `selectionStart: number | null;`; `setSelectionRange(start: number | null, end: number | null, direction?: SelectionDirection): void;`; `setRangeText(replacement: string, start: number, end: number, selectionMode?: SelectionMode): void;`]

`selectionStart`/`selectionEnd` are nullable on `HTMLInputElement` — they read `null` for input types that do not support text selection. Any caret arithmetic reading them must narrow before use; under `tseslint.configs.strictTypeChecked` an unnarrowed read is a type error, not a warning. `setSelectionRange` accepts nullable arguments, takes an optional `SelectionDirection`, and returns `void`. `setRangeText` also exists and combines range replacement with selection placement, but it mutates the DOM node's value directly and is therefore unsuitable for a React controlled input, whose next render overwrites the DOM value from state.
