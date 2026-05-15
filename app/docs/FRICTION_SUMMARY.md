# Friction Brief for Image Framing implementation

## Initial Friction brief

SF5/SF6 committed together: dimensions in ImageViewerDialog was flagged unused by tsc until SF6 wired it — spec anticipated this correctly. Both SFs were implemented before the first commit.
update.test.ts initial assertion: Used toHaveBeenCalledOnce() without accounting for migration execute calls. Fixed immediately after first vitest run.
Spurious ImageFrame import: Copied from the spec's code sketch into FramingOverlay.tsx; tsc caught it immediately.
Instruction gaps (non-blocking, surfaced by reviewer):

app/src/CLAUDE.md documents the as React.CSSProperties cast for DB-sourced runtime custom properties, but the reviewer noted there's no documented pattern for objects that mix standard and custom CSS properties in the same declaration. The existing pattern covers it adequately, but the rule could be made explicit.
