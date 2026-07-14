# pixi.js

## Application renders the full stage on every ticker tick, and the ticker auto-starts by default

**Verified at:** pixi.js 8.19.0 (installed; `package.json` declares `^8.19.0`)
**Citation:** [I_1: file read node_modules/pixi.js/lib/app/TickerPlugin.mjs:12-45 — `TickerPlugin.init` defaults `{ autoStart: true, sharedTicker: false }` and registers `ticker.add(this.render, this, UPDATE_PRIORITY.LOW)`; `autoStart` calls `this.start()`]

`Application.init` installs a per-app `Ticker` that calls `app.render()` (full stage render) on every tick, starting immediately. A Pixi app with a fully static stage still re-renders the entire canvas every animation frame unless `app.ticker.stop()` is called (or `autoStart: false` is passed and rendering is driven manually via `app.render()`).

## WebGL renderer accepts a `powerPreference` context hint

**Verified at:** pixi.js 8.19.0 (installed; `package.json` declares `^8.19.0`)
**Citation:** [I_2: file read node_modules/pixi.js/lib/rendering/renderers/gl/context/GlContextSystem.d.ts:12-37 — `ContextSystemOptions.powerPreference?: GpuPowerPreference`, values `'high-performance'` or `'low-power'`, default `'default'`]

`Application.init` options forward `powerPreference` to the WebGL context creation. `'low-power'` hints the browser to use the integrated GPU on dual-GPU machines; `'high-performance'` prioritizes the discrete GPU.

## Ticker.system runs a permanent rAF loop for every live renderer — stopping app.ticker alone does not idle a Pixi app

**Verified at:** pixi.js 8.19.0 (installed; `package.json` declares `^8.19.0`)
**Citation:** [I_4: file read node_modules/pixi.js/lib/rendering/renderers/shared/SchedulerSystem.mjs:14 — `Ticker.system.add(this._update, this)` in `init()`; file read node_modules/pixi.js/lib/events/EventTicker.mjs:39 — `Ticker.system.add(this._tickerUpdate, this, UPDATE_PRIORITY.INTERACTION)`; ran top against the GM-Tool Tauri dev app — app.ticker.stop() alone left ~13% combined idle CPU, app.ticker.stop() + Ticker.system.stop() dropped it to 0.0]

`SchedulerSystem` (renderer init) and `EventTicker` (event system) both subscribe to the global `Ticker.system`, which has `autoStart: true` — so a renderer keeps a 60Hz requestAnimationFrame loop alive even when the application ticker is stopped and nothing renders. `Ticker.system.stop()` halts it; it restarts automatically when a new renderer initializes, because `Ticker.add` calls `_startIfPossible()` which starts a stopped ticker whose `autoStart` is true (Ticker.mjs:160-163, 254). `CanvasObserver` is not a rAF source when `ResizeObserver` exists — it only falls back to `Ticker.shared` without it (CanvasObserver.mjs:74-76).
