---
paths: ["app/eslint-rules/**", "eslint-rules/**"]
---

# Unit tests under `eslint-rules/`

## Testing Policy

- **Required**: adding a local ESLint rule to `app/eslint-rules/`, or changing the logic that decides what an existing one reports, includes adding or updating its test file `app/eslint-rules/__tests__/<rule-file-name>.test.js` in the same change. A rule with no conditional or loop deciding what it reports (for example its `create` only maps a node type to a fixed report) needs no test — it has nothing a test could distinguish — and neither does an edit that leaves the deciding logic unchanged (message text, `meta`, formatting). Put the deciding logic in exported pure functions and test those; pass anything environmental in as an argument — `findCrossedBoundary` in `no-import-past-index.js` takes `isBoundary` as a function instead of calling `fs.existsSync` itself, so a test supplies a stub. The rule's `create` function only wires those functions to the ESLint API and needs no test of its own; when the change that adds a rule or alters its deciding logic finds that logic inside `create`, it extracts the logic into exported functions and tests those.
