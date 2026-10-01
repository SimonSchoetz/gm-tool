---
paths: ["app/src/providers/**", "src/providers/**"]
---

# Providers under `src/`

Conventions for any file under `src/providers/`. Hook-hygiene rules, including the obligation to verify the provider tree before placing a hook call, are in `.claude/rules/src-react-hooks.md`, whose globs cover this directory.

## providers/

`providers/` is app-level UI infrastructure — React Context providers that wrap the app root and expose hooks. Data infrastructure (e.g. `TanstackQueryClientProvider`) stays in `data-access-layer/`. `providers/` has no `index.ts`: each provider, and each context-and-hook module split out by the rule below, lives in its own module directory, which has an `index.ts` only when it holds more than its one source file (`app/src/CLAUDE.md` — Barrel Files), and is imported as `@/providers/<Module>` or `@/providers/<Module>/<Module>`.

**When `import-x/no-cycle` reports a cycle through a provider module, move the provider's context and hook into a module of their own.** The cycle arises when a component that calls the provider's hook is itself reachable from the provider's imports (for example, something the provider renders imports it): importing the hook from the provider's module then leads back to that component. A module holding only the context and hook imports neither the provider nor anything it renders, so the hook's consumers import it without closing the cycle. `src/providers/PinnedPopupsContext/` is the instance: it holds `PinnedPopupsContext` and `usePinnedPopups`, which `src/components/TextEditor/components/MentionBadge/MentionBadge.tsx` imports as `@/providers/PinnedPopupsContext`, because `src/providers/PinnedPopupsProvider/PinnedPopupsProvider.tsx` imports `src/components/MentionPopup/`, whose imports reach `MentionBadge.tsx` through `TextEditor`. Without such a cycle, the context, provider and hook stay in one module directory as separate files behind one `index.ts`, as in `src/providers/DeleteDialogProvider/`.

**Context value types contain only what external consumers call through the hook.** A function called only by the provider component itself belongs in local scope there, not on the `ContextValue` type — placing provider-internal functions there widens the public interface beyond what consumers need and obscures which operations are genuinely external.

A component rendered exclusively by a provider does not belong in that provider's module directory — see the provider-modules exception under Sub-component ownership in `.claude/rules/src-components.md` — Component Library.
