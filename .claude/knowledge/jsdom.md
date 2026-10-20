# jsdom

## jsdom does not compute layout

**Verified at:** jsdom 30.1.1, read 2026-10-20
**Citation:** [instruction-pass_12: app/node_modules/.pnpm/jsdom@30.1.1/node_modules/jsdom/README.md:527-538 — "Layout" is listed as unimplemented; many layout-related properties return zeros]

Many layout-related values, such as `offsetTop`, read as zeros in a jsdom test.
