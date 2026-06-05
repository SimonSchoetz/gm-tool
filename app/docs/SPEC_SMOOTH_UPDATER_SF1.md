# SF1: Windows Platform Config

Create `tauri.windows.conf.json` with NSIS per-user scope and quiet install mode. This file is automatically merged by Tauri v2 on Windows builds.

## Files Affected

- `New:` `app/src-tauri/tauri.windows.conf.json`

## Config Layer

Create `app/src-tauri/tauri.windows.conf.json` with the following content:

```json
{
  "bundle": {
    "targets": ["nsis"],
    "windows": {
      "nsis": {
        "installMode": "perUser"
      }
    }
  },
  "plugins": {
    "updater": {
      "windows": {
        "installMode": "quiet"
      }
    }
  }
}
```

`targets: ["nsis"]` overrides the base `tauri.conf.json`'s `"all"` for Windows only — MSI is excluded because MSI updates always run through Windows Installer Service (system-level), which requires elevation regardless of other settings.

`nsis.installMode: "perUser"` installs to `%LOCALAPPDATA%\Programs\GM-Tool`. This is the prerequisite for quiet mode: quiet mode requires either pre-existing admin rights or a per-user install scope.

`plugins.updater.windows.installMode: "quiet"` suppresses the installer UI during updates. The NSIS executable runs silently with no wizard dialogs.
