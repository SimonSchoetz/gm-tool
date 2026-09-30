# Vite

## Importing through a barrel file makes the Vite dev server fetch and transform every module the barrel re-exports; Vite recommends importing the individual module instead

**Verified at:** https://vite.dev/guide/performance, 2026-09-30
**Citation:** [architect_1: https://vite.dev/guide/performance]

The performance guide explains that every file behind a barrel must be fetched and transformed because any of them may have side effects that run on initialization, which slows dev-server page loads. Its example prefers `import { slash } from './utils/slash.js'` over `import { slash } from './utils'`.
