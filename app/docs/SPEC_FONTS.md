# Fonts

- Sub-feature 1: Bundle IBM Plex fonts — add IBM Plex Sans and IBM Plex Mono as self-hosted webfonts, wire them into the existing typography tokens

## Key Architectural Decisions

### Self-hosted webfonts via versioned npm packages, not OS-level installation or hand-downloaded binaries

GM Tool's renderer is a Tauri WebView shipped to end-user machines outside this repo's control; an OS-installed font only renders consistently if every end user's OS happens to already have it, which defeats the purpose of choosing a specific typeface. `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` (both versioned npm packages, currently `5.3.0`) ship the font files plus ready-made `@font-face` CSS with one importable stylesheet per weight/style, so the font renders identically regardless of the host OS's installed fonts, with no hand-written `@font-face` rules or manually-tracked license file to maintain. IBM Plex is licensed under SIL OFL 1.1, which explicitly permits this kind of bundling and redistribution.

### Only the weight/style combinations the codebase actually produces are imported

The existing `--font-weight-normal` (400), `--font-weight-medium` (500), `--font-weight-semi-bold` (600), and `--font-weight-bold` (700) tokens in `typography-variables.css` are the only weights referenced anywhere in `src/`. Italic is applied independently of weight by Lexical's `text-italic` theme class (`TextEditor.tsx`'s `theme.text.italic`), which is combinable with `text-bold` on the same text run (Lexical applies both classes simultaneously when both format flags are set) and is not restricted to any particular block type — the italic toolbar button (`textFormattingConfig.ts`) has no per-heading-type gating, so heading text (weight 500, per `TextEditor.css`'s `.editor-heading-h1/h2/h3`) can also carry the italic class. This means italic can co-occur with weight 400 (plain body text), 500 (headings), and 700 (bold text), but never with 600 — the only site using `--font-weight-semi-bold` is `SlashCommandOptionList.css`, a non-editable dropdown menu item with no italic toggle. Imported files: Sans `400`, `400-italic`, `500`, `500-italic`, `600`, `700`, `700-italic`; Mono `400` only, since its sole current consumer (the device-pairing code input) renders unstyled body-weight text with no bold or italic treatment.

### Font CSS is imported as a JS-side side-effect import in `main.tsx`, not via the `styles/index.css` `@import` chain

Vite's own features documentation confirms CSS `@import` inlining via `postcss-import` but does not confirm that a bare npm package specifier resolves from inside a `.css` file's `@import` statement — this is an unconfirmed mechanism (recorded in `.claude/knowledge/fonts.md`). Vite's JS-side import resolution unambiguously handles bare npm specifiers, including CSS side-effect imports from a `.ts`/`.tsx` file, and this is also `@fontsource`'s own documented usage pattern for bundler-based projects. This is the first third-party CSS package added to the project — the existing `styles/index.css` `@import` chain aggregates only first-party CSS (`variables/`, `global.css`, `reset.css`, `scrollbar.css`), and no CLAUDE.md rule requires third-party CSS to route through it.

### `--font-family-mono` is a new token, added alongside the existing `--font-family`; the old fallback stack is dropped

`typography-variables.css` already defines `--font-family`, consumed by `global.css`'s `body` rule — no consumer-side change is needed there. `--font-family-mono` follows the same single-token pattern for the second typeface family `app/docs/_product/epics/fonts.md` establishes for "code, IDs, coordinates, metadata, version numbers, technical labels." The current `--font-family` value (`Inter, Avenir, Helvetica, Arial, sans-serif`) is unrelated template boilerplate — none of those names appear in the fonts epic, and `Inter` was never bundled, so the app was already silently falling back past it on most machines. Both tokens are simplified to the chosen typeface plus a single generic CSS fallback keyword (`sans-serif` / `monospace`) rather than carrying forward a list of specific font names nobody deliberately chose. The one existing raw `font-family: monospace` literal (`PairDeviceDialog.css`'s `.pair-device-dialog--code-input`, which renders a pairing code — exactly the "IDs" case the epic assigns to Mono) is migrated to `var(--font-family-mono)`; no other site in `src/` uses a raw `monospace` value.

## Sub-feature 1: Bundle IBM Plex fonts

Add IBM Plex Sans and IBM Plex Mono as bundled, self-hosted webfonts via the `@fontsource` npm packages, and wire the existing `--font-family` token plus a new `--font-family-mono` token to them.

### Files affected

Modified:

- `app/package.json` — add `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` to `dependencies`
- `app/package-lock.json` — regenerated automatically via `npm install`; no manual authoring
- `app/src/main.tsx` — add font CSS side-effect imports
- `app/src/styles/variables/typography-variables.css` — update `--font-family` value, add `--font-family-mono`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/PairDeviceDialog.css` — replace the raw `font-family: monospace;` on `.pair-device-dialog--code-input` with `font-family: var(--font-family-mono);`

New: None.
Moved: None.
Draft: None.

### Frontend

**Purpose**: Establish IBM Plex Sans as the bundled, self-hosted UI font-family and IBM Plex Mono as the bundled, self-hosted font-family for code/ID/metadata contexts, per `app/docs/_product/epics/fonts.md`, replacing the current unbundled fallback stack that has no guaranteed match on any given user's machine.

**Behavior**: No interactive behavior, component state, or async data is introduced — this is a static asset and CSS-token change. No loading/error/empty states apply: the fonts are bundled into the app at build time and are available synchronously on first paint, the same as any other static asset already in the bundle.

**UI / Visual**:

- `app/package.json`: add `"@fontsource/ibm-plex-sans": "^5.3.0"` and `"@fontsource/ibm-plex-mono": "^5.3.0"` to `dependencies`, placed alphabetically among the existing `@`-scoped entries.
- `app/src/main.tsx`: add the following imports directly after the existing `import './styles/index.css';` line. These are JS-side imports rather than additions to the `styles/index.css` `@import` chain — see the KAD "Font CSS is imported as a JS-side side-effect import in `main.tsx`, not via the `styles/index.css` `@import` chain":

  ```ts
  import '@fontsource/ibm-plex-sans/400.css';
  import '@fontsource/ibm-plex-sans/400-italic.css';
  import '@fontsource/ibm-plex-sans/500.css';
  import '@fontsource/ibm-plex-sans/500-italic.css';
  import '@fontsource/ibm-plex-sans/600.css';
  import '@fontsource/ibm-plex-sans/700.css';
  import '@fontsource/ibm-plex-sans/700-italic.css';
  import '@fontsource/ibm-plex-mono/400.css';
  ```

- `app/src/styles/variables/typography-variables.css`: change `--font-family: Inter, Avenir, Helvetica, Arial, sans-serif;` to `--font-family: 'IBM Plex Sans', sans-serif;`. Add a new line directly after it: `--font-family-mono: 'IBM Plex Mono', monospace;`.
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/PairDeviceDialog.css`: on the `.pair-device-dialog--code-input` rule, replace `font-family: monospace;` with `font-family: var(--font-family-mono);`.

No new component, screen, or route is introduced; `global.css`'s existing `body { font-family: var(--font-family); }` rule requires no change since it already reads the token being updated.

### Test coverage

No test file changes. This sub-feature has no branching logic, computed values, or component behavior to unit test — it is a static dependency addition and a CSS token/literal substitution, both outside the Testing Policy's scope (helper functions and util functions).

## CLAUDE.md impact

`app/CLAUDE.md`'s tech stack table lists `Styling: TBD`. This spec resolves it to a concrete choice: IBM Plex Sans (UI) and IBM Plex Mono (code/IDs/metadata) as self-hosted webfonts, delivered via the versioned `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` npm packages and applied through the `--font-family`/`--font-family-mono` custom properties in `app/src/styles/variables/typography-variables.css` `[S_1: WebFetch registry.npmjs.org/@fontsource/ibm-plex-sans/latest — version 5.3.0 confirmed; S_2: WebFetch registry.npmjs.org/@fontsource/ibm-plex-mono/latest — version 5.3.0 confirmed]`.
