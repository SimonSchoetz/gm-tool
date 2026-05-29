# Automated Updates Epic

## User Stories

### Update Infrastructure + build pipeline

As the owner of the app, I want to give the users the ability to update the app so they can stay up-to-date and enjoy the latest features and bug fixes.

#### Notes from a session with an architect:

- GitHub Actions pipeline using tauri-action — builds, signs, and publishes release artifacts on version tag
- Signing keypair generated once: private key stored as GitHub Actions secret, public key embedded in tauri.conf.json
- tauri-plugin-updater added and configured in the Rust layer
- Tauri command check_update implemented — returns available version info or signals "up to date"
- _system table: key TEXT PRIMARY KEY, value TEXT (JSON). Bootstrapped by database.ts on init (CREATE TABLE IF NOT EXISTS). No seed rows. db/_system/ module owns all domain-level read/write access.
- Settings screen restructured: existing table config content extracted into <TableConfigSection /> sub-component; <AppVersionSection /> added with current app version display (read from Tauri's app metadata API, not from the database)

### UX updates

As User, I want to be able to time the updates so I am not disturbed by them when I need to use the app now rather than when the update is finished.

#### Notes:

- new AppUpdateProvider added to src/providers/, renders update modal via createPortal to document.body. Exposes checkForUpdates via context. Follows the DeleteDialogProvider pattern.
- 2 paths to open app update dialog:
  - startup auto-check finds newer version than current or snoozed version
  - button in the <AppVersionSection /> in settings is clicked
- Both trigger paths — startup auto-check and the button in the <AppVersionSection /> in settings — call the same checkForUpdates. One modal instance, one implementation.
- Auto-check always runs on app startup
- modal has 2 options: confirm update or snooze
- Modal flow: 
  - confirm → download progress indicator → app restarts with new version applied
  - clicking on "Not Now" button writes the available version to _system under versioning.snoozed_version. -> dismissing the modal does NOT write to snoozed_version so it will be shown again on next app startup
- Snooze: before showing the modal, reads versioning.snoozed_version from _system; if it matches the available version, modal is suppressed. 
- <AppVersionSection /> completed with: button 
  - states:
    - when snoozed version matches available or is `null` it says "Check for updates"
    - when snoozed version doesn't match current version (must be a version number, not `null`) it says "Update available")
- Error handling covers both the startup path and the on-demand path
- Edge case: Snoozed version is `null`: checkForUpdates only acts on current version
- db migration: adds `snoozed_version: null` `versioning` row in `_system` on first run


## Out of scope

- own website where the builds are hosted
- displaying changelog in app
