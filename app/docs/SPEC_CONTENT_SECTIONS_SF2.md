# Sub-feature 2: Unwrap domain-scaffold.md

`app/docs/_product/domain-scaffold.md` is the project's long-living reference document, and Sub-feature 4 edits its "Detail Screen Composition" section. Its prose is hard-wrapped at about 90 characters, which the shared Code Style rule beginning "No manual line breaks within a single logical unit" forbids for text a later reader loads. Reflowing all 311 lines would bury Sub-feature 4's real change, so it is its own commit first (the shared Best Practices & Code Quality rule beginning "When editing a file for an unrelated task, fix convention violations"). Commit type: `docs`.

## Files affected

- `Modified:`
  - `app/docs/_product/domain-scaffold.md` — join every hard-wrapped prose paragraph and list item into one line
- `Deleted:` none
- `New:` none
- `Moved:` none
- `Draft:` none

## Docs

### `app/docs/_product/domain-scaffold.md` — Modified

- Each prose paragraph becomes a single line: its wrapped lines joined with one space.
- Each list item becomes a single line at its existing indentation and marker; a wrapped continuation line joins the item it continues. Nested items keep their own indentation.
- Unchanged: headings, blank lines, fenced code blocks and their contents (the wrapped text inside the `text` block under "Usage" stays as it is — code blocks are outside the rule), table rows, and every word and character other than the joining whitespace.

## Verification

From the repository root, this comparison of the file at `HEAD` and in the working tree, with every whitespace run collapsed to one space, prints nothing when only line breaks changed. This is reasoned from what `tr -s` does, not run:

```bash
diff <(git show HEAD:app/docs/_product/domain-scaffold.md | tr -s '[:space:]' ' ') <(tr -s '[:space:]' ' ' < app/docs/_product/domain-scaffold.md)
```

`app/.prettierignore` lists `docs/`, so `npx prettier --check .` does not read this file. Check it against `.markdownlint.json` at the repository root by hand — the reflow touches no fence, heading or list marker, so no rule's outcome changes.
