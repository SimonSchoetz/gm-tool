---
paths: ["app/src/providers/**", "src/providers/**"]
---

# Providers under `src/`

Conventions for any file under `src/providers/`. Hook-hygiene rules, including the obligation to verify the provider tree before placing a hook call, are in `.claude/rules/src-react-hooks.md`, whose globs cover this directory.

## providers/

`providers/` is app-level UI infrastructure — React Context providers that wrap the app root and expose hooks. Data infrastructure (e.g. `TanstackQueryClientProvider`) stays in `data-access-layer/`. It is a grouping folder: its `index.ts` uses explicit named exports, and each provider lives in its own module directory with a required `index.ts` barrel.

**Context value types contain only what external consumers call through the hook.** A function called exclusively inside the provider's own module belongs in local scope, not on the `ContextValue` type — placing provider-internal functions there widens the public interface beyond what consumers need and obscures which operations are genuinely external.

A component rendered exclusively by a provider does not belong in that provider's module directory — see the provider-modules exception under Sub-component ownership in `.claude/rules/src-components.md` — Component Library.
