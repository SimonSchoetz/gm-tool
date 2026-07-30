# Fonts

## IBM Plex typeface family is licensed under SIL Open Font License 1.1

**Verified at:** https://raw.githubusercontent.com/IBM/plex/master/LICENSE.txt (fetched 2026-07-30)
**Citation:** [A_1: WebFetch https://raw.githubusercontent.com/IBM/plex/master/LICENSE.txt — SIL OFL 1.1, confirmed]

SIL OFL 1.1 permits the font to be bundled, embedded, and redistributed with commercial or personal software, provided the copyright notice and license text travel with the distribution and the font is never sold standalone. Modified versions may not reuse the reserved name "Plex" without permission. This covers both IBM Plex Sans and IBM Plex Mono (both published under the same IBM/plex repository license).

## @fontsource npm packages provide pre-packaged self-hosted Google Fonts for bundlers

**Verified at:** https://fontsource.org/fonts/ibm-plex-sans (fetched 2026-07-30)
**Citation:** [A_2: WebFetch https://fontsource.org/fonts/ibm-plex-sans — package existence and per-weight CSS entry points confirmed]

`@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` are versioned npm packages that ship the font files plus ready-made `@font-face` CSS, with one importable CSS entry point per weight/style (e.g. `@fontsource/ibm-plex-sans/400.css`) so a consumer only pulls in the weights it actually imports. This avoids hand-downloading font binaries and hand-writing `@font-face` rules. Exact import syntax and available weight/style entry points were not verified against the package's own `package.json`/exports map in this session — verify that before writing implementation code.

## @fontsource/ibm-plex-sans and @fontsource/ibm-plex-mono latest version and file layout (as of spec-writing)

**Verified at:** registry.npmjs.org (version metadata) + app.unpkg.com (file listing), both for version 5.3.0 (fetched 2026-07-30)
**Citation:** [S_1: WebFetch registry.npmjs.org/@fontsource/ibm-plex-sans/latest — version 5.3.0 confirmed; S_2: WebFetch registry.npmjs.org/@fontsource/ibm-plex-mono/latest — version 5.3.0 confirmed; S_3: WebFetch app.unpkg.com/@fontsource/ibm-plex-sans@5.3.0 — weight-file listing confirmed; S_4: WebFetch app.unpkg.com/@fontsource/ibm-plex-mono@5.3.0 — weight-file listing confirmed]

Both packages are at version `5.3.0`. Each ships one CSS file per weight/style combination at the package root: `100.css` through `700.css`, each with an `-italic` counterpart (e.g. `400.css`, `400-italic.css`), plus an `index.css` that pulls in every weight. The package `exports` map resolves any `./*.css` specifier (e.g. `@fontsource/ibm-plex-sans/400.css`) directly — no subpath outside this map is valid. Each weight file's `@font-face` rules cover all script subsets (latin, cyrillic, etc.) via `unicode-range`, so importing e.g. `400.css` does not force-download unused subsets — the browser only fetches the `.woff2` matching the unicode ranges actually rendered on the page.

## Vite's bare-specifier CSS `@import` support for npm packages is unconfirmed — use a JS-side side-effect import instead

**Verified at:** vite.dev/guide/features.html (fetched 2026-07-30)
**Citation:** [S_5: WebFetch vite.dev/guide/features.html — page confirms postcss-import-based `@import` inlining but does not confirm bare npm specifier resolution from a `.css` file's `@import`]

Vite's own features doc confirms CSS `@import` inlining via `postcss-import` and alias respecting, but does not explicitly state whether a bare npm package specifier (e.g. `@import '@fontsource/pkg/400.css';`) resolves from inside a `.css` file. Vite's JS-side import resolution (esbuild/Rollup) unambiguously handles bare npm specifiers, including CSS side-effect imports (`import '@fontsource/pkg/400.css';` inside a `.ts`/`.tsx` file) — this is also `@fontsource`'s own documented usage pattern for bundler-based projects. Prefer the JS-side import for any future npm-package CSS to avoid the unconfirmed CSS-`@import` path.
