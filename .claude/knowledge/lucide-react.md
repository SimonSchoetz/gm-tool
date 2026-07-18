# lucide-react

## `lucide-react`'s main entry already exports every icon under both its bare name and a pre-suffixed `*Icon` alias — manual `as` aliasing is never required

**Verified at:** lucide-react 1.23.0
**Citation:** [I_1: app/node_modules/lucide-react/dist/lucide-react.d.ts — grep confirmed `Table2 as Table2Icon`, `Trash2 as Trash2Icon`, `ArrowUpFromLine as ArrowUpFromLineIcon`, `ArrowDownFromLine as ArrowDownFromLineIcon`, `ArrowLeftFromLine as ArrowLeftFromLineIcon`, `ArrowRightFromLine as ArrowRightFromLineIcon` all present in the same `export { ... }` statement as the bare names; spot-checked `AArrowDown as AArrowDownIcon` to confirm the dual-export pattern is not limited to these six icons]

The previous version of this entry was wrong: it verified only that the bare names (`Table2`, `Trash2`, etc.) exist, and from that incorrectly concluded that the project's `*Icon`-suffix convention (root `app/src/CLAUDE.md` — "Icon components ... always bound to a name ending in Icon ... rename via the import alias **when necessary**") required manual `import { Table2 as Table2Icon } from 'lucide-react'` aliasing. It does not: `lucide-react`'s main package entry point (`dist/lucide-react.d.ts`, the file resolved by the bare `'lucide-react'` specifier — no subpath needed) exports **every** icon twice — once under its bare name and once under an auto-generated `*Icon`-suffixed alias — for the entire icon set, not just the six checked here. `import { Table2Icon } from 'lucide-react'` is a real, direct named import; aliasing is not "necessary" for this library and must not be added. Before writing an icon import with `as XIcon` for any icon library, grep that library's main type declaration file for the pre-suffixed name first — only alias when the library genuinely does not already export one.

## The globe status icon family includes GlobeCheckIcon, GlobeOffIcon, GlobeXIcon, and GlobeLockIcon — GlobeAlertIcon does not exist

**Verified at:** lucide-react 1.23.0
**Citation:** [S_7: grep GlobeCheckIcon|GlobeOffIcon|GlobeAlertIcon|GlobeXIcon|GlobeLockIcon app/node_modules/lucide-react/dist/lucide-react.d.ts — found GlobeCheckIcon, GlobeLockIcon, GlobeOffIcon, GlobeXIcon; GlobeAlertIcon not found]

Available globe-state icons for connectivity indicators: `GlobeCheckIcon`, `GlobeOffIcon`, `GlobeXIcon`, `GlobeLockIcon`. There is no `GlobeAlertIcon`.
