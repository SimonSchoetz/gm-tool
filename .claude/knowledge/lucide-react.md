# lucide-react

## `lucide-react`'s main entry exports every declared icon under a pre-suffixed `*Icon` alias — manual `as` aliasing is never required

**Verified at:** lucide-react 1.49.0
**Citation:** [spec-writer_1: app/node_modules/lucide-react/package.json:28 — `"typings": "dist/lucide-react.d.ts"`; grep -c '"exports"' app/node_modules/lucide-react/package.json — 0 found, so no exports map overrides it] [spec-writer_2: ran `python3 -I` with the regexes `^declare const ([A-Z][A-Za-z0-9]*): LucideIcon;` and `([A-Za-z0-9]+) as ([A-Za-z0-9]+Icon)` (the latter inside each `^export \{([^}]*)\}` block) over app/node_modules/lucide-react/dist/lucide-react.d.ts — observed 1857 declared icons, all 1857 also exported as `<Name> as <Name>Icon`, among them `Table2 as Table2Icon`]

`lucide-react`'s main package entry point (`dist/lucide-react.d.ts`, the file resolved by the bare `'lucide-react'` specifier — no subpath needed) exports **every** declared icon under a `*Icon`-suffixed alias. `import { Table2Icon } from 'lucide-react'` is a real, direct named import; aliasing must not be added. Before writing an icon import with `as XIcon` for any icon library, grep that library's main type declaration file for the pre-suffixed name first — only alias when the library genuinely does not already export one.

## EllipsisVerticalIcon, PinIcon, and PinOffIcon all exist; both `EllipsisVerticalIcon` and `MoreVerticalIcon` are exported for the vertical three-dot glyph

**Verified at:** lucide-react 1.49.0
**Citation:** [spec-writer_1: grep -oE '\b[A-Za-z0-9]+ as (EllipsisVertical|MoreVertical|Pin|PinOff)(Icon)?\b' app/node_modules/lucide-react/dist/lucide-react.d.ts — found `EllipsisVertical as EllipsisVerticalIcon`, `EllipsisVertical as MoreVertical`, `EllipsisVertical as MoreVerticalIcon`, `Pin as PinIcon`, `PinOff as PinOffIcon`]

`EllipsisVerticalIcon`, `MoreVerticalIcon` and `MoreVertical` are all export aliases of `EllipsisVertical`. `PinIcon` and `PinOffIcon` are the aliases of `Pin` and `PinOff`. All are exported pre-suffixed from the main entry, so no `as` aliasing is required.

## The globe status icon family includes GlobeCheckIcon, GlobeOffIcon, GlobeXIcon, and GlobeLockIcon — GlobeAlertIcon does not exist

**Verified at:** lucide-react 1.49.0
**Citation:** [spec-writer_1: grep -oE '\bGlobe(Check|Off|Alert|X|Lock)Icon\b' app/node_modules/lucide-react/dist/lucide-react.d.ts — found GlobeCheckIcon, GlobeLockIcon, GlobeOffIcon, GlobeXIcon; GlobeAlertIcon not found]

Available globe-state icons: `GlobeCheckIcon`, `GlobeOffIcon`, `GlobeXIcon`, `GlobeLockIcon`. There is no `GlobeAlertIcon`.

## `MenuIcon`, `PlusIcon` and `Trash2Icon` are exported from the main entry, with `Trash2Icon` an alias of the `Trash` icon

**Verified at:** lucide-react 1.49.0
**Citation:** [spec-writer_1: grep -oE '[A-Za-z0-9]+ as (Menu|Plus|Trash2)Icon' app/node_modules/lucide-react/dist/lucide-react.d.ts — found `Menu as MenuIcon`, `Plus as PlusIcon`, `Trash as Trash2Icon`] [spec-writer_2: grep -c "declare const Trash2" app/node_modules/lucide-react/dist/lucide-react.d.ts — 0 found; the same pattern form, grep -c "declare const Table2:", finds 1]

`Trash2Icon` is exported as an alias of the icon declared as `Trash`, and no `Trash2` declaration exists at this version.
