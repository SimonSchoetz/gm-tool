# Prettier Setup for Zed

## Prerequisites

Install `prettierd` globally (keeps a persistent daemon — avoids Node.js startup cost on every save):

```bash
npm install -g @fsouza/prettierd
```

## Global Zed settings (`~/.config/zed/settings.json`)

Add the following to route TS/TSX/JS formatting through prettierd:

```json
{
  "format_on_save": "on",
  "languages": {
    "TypeScript": {
      "formatter": {
        "external": {
          "command": "/path/to/prettierd",
          "arguments": ["{buffer_path}"]
        }
      }
    },
    "TSX": {
      "formatter": {
        "external": {
          "command": "/path/to/prettierd",
          "arguments": ["{buffer_path}"]
        }
      }
    },
    "JavaScript": {
      "formatter": {
        "external": {
          "command": "/path/to/prettierd",
          "arguments": ["{buffer_path}"]
        }
      }
    }
  }
}
```

Find the correct path with `which prettierd` and substitute it above.

**Note:** The path is nvm-version-specific. After switching node versions, run `npm install -g @fsouza/prettierd` again under the new version.

## Project-level Prettier config (`app/.prettierrc`)

Prettier options go here — not in Zed settings:

```json
{
  "singleQuote": true
}
```

Prettier resolves this file by walking up from the file being formatted, so placing it at `app/` covers the entire app.
