# SVG

## In an SVG image in macOS WebKit, a path with `pathLength="1"` dashed `3/7 1` was painted at sample points up to 0.40 of its length and not from 0.46 on, and one dashed `1 1` at every sample point

**Verified at:** WebKit 22625.2.8.11.9 on macOS 27.2.1 — 2026-11-26
**Citation:** [sub-feature-implementer_1: ran a `swiftc`-built `WKWebView` script that drew a 64 px SVG path of straight lines and quarter arcs through an `<img>` into a canvas and read the alpha at points 0.05, 0.25, 0.40, 0.46, 0.70 and 0.97 along it — observed, with share 3/7, the first three painted and the last three not, and with share 1 all six painted]

The probe covered a path with `fill="none"` and the default butt line cap, drawn as an SVG image; an inline `<svg>` in a page was not probed.
