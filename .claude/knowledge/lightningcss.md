# Lightning CSS

## Lightning CSS 1.33.0, minifying, rewrites an `animation` shorthand into longhands with `animation-duration: 0s`, even when the shorthand says `auto`, and keeps a longhand `animation-duration: auto`

**Verified at:** lightningcss 1.33.0 under Vite 8.3.8, whose default `build.cssMinify` is `lightningcss`
**Citation:** [claude_1: ran lightningcss 1.33.0 `transform({ minify: true })` on `.a{animation:x linear both,y linear both;animation-timeline:scroll(self)}`, `.c{animation:x auto linear both,y auto linear both;animation-timeline:scroll(self)}` and `.b{animation-name:x,y;animation-duration:auto;animation-timing-function:linear;animation-fill-mode:both;animation-timeline:scroll(self)}` — observed `animation-duration:0s,0s` for `.a` and `.c`, `animation-duration:auto` for `.b`] [claude_2: `app/node_modules/vite/dist/node/index.d.ts:2787` — "When `build.cssMinify` is `lightningcss` (the default)", in `vite` 8.3.8 (`app/node_modules/vite/package.json:3`)] [claude_3: ran `pnpm run build:frontend` in `app/` — observed `animation-duration:0s,0s` in the built `.scroll-edge-fade` rule written with the shorthand]

So a scroll-driven animation written with the shorthand reaches the production build with a duration of `0s`; what WebKit then renders is the `css.md` entry beginning "In WebKit on macOS 27.2, a scroll-driven animation with `animation-duration: 0s`".
