# Friction Brief for Image Framing implementation

## Initial Friction brief

SF5/SF6 committed together: dimensions in ImageViewerDialog was flagged unused by tsc until SF6 wired it — spec anticipated this correctly. Both SFs were implemented before the first commit.
update.test.ts initial assertion: Used toHaveBeenCalledOnce() without accounting for migration execute calls. Fixed immediately after first vitest run.
Spurious ImageFrame import: Copied from the spec's code sketch into FramingOverlay.tsx; tsc caught it immediately.
Instruction gaps (non-blocking, surfaced by reviewer):

app/src/CLAUDE.md documents the as React.CSSProperties cast for DB-sourced runtime custom properties, but the reviewer noted there's no documented pattern for objects that mix standard and custom CSS properties in the same declaration. The existing pattern covers it adequately, but the rule could be made explicit.

## Post-implementation friction

**Architect misclassified constant duplication as an in-scope violation**

The architect upgraded "Concern 2" (the `200`/`350` values appearing in both `FramingOverlay.tsx` and `FramingOverlay.css`) to an in-scope violation, citing the two-consumers-in-same-module-directory rule. The implementer accepted the ruling and created `FramingOverlay.constants.ts`.

The premise was false: a `.css` file cannot import from a `.ts` constants file. The `200px`/`350px` CSS fallback values are CSS-native syntax and can never be replaced by a TS constant — they must remain hardcoded in the CSS regardless. The TS constant had exactly one real consumer (`FramingOverlay.tsx`), satisfying the single-consumer rule that keeps constants inlined. The two-consumer rule requires both sides to be able to import from the shared source; coincidental numeric duplication across a TS file and a CSS file does not qualify.

**Source:** The implementer should have applied the Engineering Validity check to the architect's brief before executing — specifically, verifying that both "consumers" could actually import from the proposed constants file. The check failed because the architect's ruling was accepted at face value without examining whether CSS can consume TS imports.

**What to add to head-of-agents / head-of-instructions:** The architect's two-consumer rule should include a constraint: both consumers must be able to import from the shared source. Cross-language "duplication" (TS value and CSS fallback that happen to match numerically) does not trigger extraction.
