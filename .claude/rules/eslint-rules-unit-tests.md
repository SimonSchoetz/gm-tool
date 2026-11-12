---
paths: ["app/eslint-rules/**", "eslint-rules/**"]
---

# Unit tests under `eslint-rules/`

## Testing Policy

- **Required**: adding a local ESLint rule to `app/eslint-rules/`, or changing the logic that decides what an existing one reports, includes adding or updating its test file `app/eslint-rules/__tests__/<rule-file-name>.test.js` in the same change. A rule with no conditional or loop deciding what it reports (for example its `create` only maps a node type to a fixed report) needs no test while it has no test file, and neither does an edit that leaves the deciding logic unchanged (message text, `meta`, formatting) to such a rule. Put the deciding logic in exported pure functions and test those; pass anything environmental in as an argument — `findCrossedBoundary` in `no-import-past-index.js` takes `isBoundary` as a function instead of calling `fs.existsSync` itself, so a test supplies a stub. The rule's `create` function wires those functions to the ESLint API; in a rule that has a test file, that wiring is tested by running the rule through ESLint's own `Linter` on source text (`app/eslint-rules/__tests__/support/lintInMemory.js`). When the change that adds a rule or alters its deciding logic finds that logic inside `create`, it extracts the logic into exported functions and tests those.
