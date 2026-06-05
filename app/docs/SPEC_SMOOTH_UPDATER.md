# Spec: Smooth Updater

## Progress Tracker

- SF1: Windows platform config [standalone] — create `tauri.windows.conf.json` with NSIS per-user scope and quiet install mode
- SF2: Rust commands [standalone] — add PendingInstall state, `download_update` + `install_and_relaunch` commands; remove `install_update`
- SF3: Domain errors + types [FOUNDATION] — add `UpdateDownloadError`, `UpdateInstallAndRelaunchError`, `DownloadProgressEvent`; remove `UpdateInstallError`
- SF4: Services [FOUNDATION] — remove `installUpdate`; add `downloadUpdate` + `installAndRelaunch`
- SF5: DAL [FOUNDATION] — remove `useInstallUpdate`; add `useDownloadUpdate` + `useInstallAndRelaunch`; update barrels
- SF6: Frontend — remove auto-install from `App.tsx`; rework `AppVersionSection` with download progress and restart button

SF1 and SF2 can be committed independently in any order. SF3+SF4+SF5+SF6 must be committed as a single atomic unit — do not run baseline checks (tsc, eslint) until all four are complete.

## Key Architectural Decisions

### Platform-specific config file

All Windows-specific Tauri settings live in `app/src-tauri/tauri.windows.conf.json` (new file). Tauri v2 automatically merges this file on Windows builds without CLI flags — no workflow changes needed. The base `tauri.conf.json` is not modified; macOS and Linux builds are unaffected.

### NSIS per-user scope eliminates UAC elevation

Setting `bundle.windows.nsis.installMode` to `"perUser"` makes the NSIS installer write to `%LOCALAPPDATA%\Programs\GM-Tool` instead of `Program Files`. Per-user installs require no admin elevation, eliminating the Windows UAC dialog on updates. The app data directory (`%APPDATA%\Roaming\com.gm-tool`, where SQLite lives) is a separate path — NSIS updates never touch it.

### Updater quiet install mode suppresses installer UI

Setting `plugins.updater.windows.installMode` to `"quiet"` tells Tauri to run the NSIS installer silently during updates. Combined with per-user scope (which satisfies the elevation requirement for quiet mode), this eliminates the installer wizard and the "delete data" prompt entirely.

### Separate Rust commands for download and install

The `download_update` command downloads the update and stores both the `Update` object and the downloaded `Vec<u8>` bytes in app state (`Mutex<Option<PendingInstall>>`). The `install_and_relaunch` command retrieves the stored data and installs it, then calls `app.restart()`. This separation allows the frontend to show a "Restart Now" button that the user triggers at a convenient time, rather than restarting immediately when download finishes.

### download_update re-checks independently

`download_update` calls `updater.check()` before downloading rather than reading a result stored by `check_update`. This keeps the state type simple: state is `None` until download is complete, `Some(PendingInstall)` after. The redundant HTTP check (one GET to the GitHub releases endpoint) is acceptable overhead.

### Progress via Tauri Channel

Download progress is streamed using `tauri::ipc::Channel`. The Rust command accepts `on_event: Channel<DownloadEvent>` and emits a `Progress { chunk_length, content_length }` event per chunk. The frontend knows download is complete when the `invoke('download_update')` Promise resolves — no `Finished` event is needed. The service layer accepts `Channel<DownloadProgressEvent>` as a parameter because `invoke` is called there; `Channel` from `@tauri-apps/api/core` is a transport type, not a React concern.

### UpdateInstallError removed

`UpdateInstallError` and `updateInstallError` are deleted along with the `install_update` command they served. Two new error types replace them: `UpdateDownloadError` (for `download_update` failures) and `UpdateInstallAndRelaunchError` (for `install_and_relaunch` failures). The old name is not reused.

## Sub-feature Files

- [SF1: Windows platform config](SPEC_SMOOTH_UPDATER_SF1.md)
- [SF2: Rust commands](SPEC_SMOOTH_UPDATER_SF2.md)
- [SF3: Domain errors + types](SPEC_SMOOTH_UPDATER_SF3.md)
- [SF4: Services](SPEC_SMOOTH_UPDATER_SF4.md)
- [SF5: DAL](SPEC_SMOOTH_UPDATER_SF5.md)
- [SF6: Frontend](SPEC_SMOOTH_UPDATER_SF6.md)

## CLAUDE.md Impact

`app/src-tauri/CLAUDE.md` — Add a "State Management" subsection to the Commands Structure section documenting the `PendingInstall` pattern: a shared state type (`Mutex<Option<PendingInstall>>`) registered in `lib.rs` via `.manage()` and accessed in commands via `State<'_, PendingInstall>`. This is the project's canonical pattern for persisting data across sequential Tauri command calls.
