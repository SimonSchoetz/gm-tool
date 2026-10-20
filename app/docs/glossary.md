# Glossary

Terms the feature pages in `features/` use. The entity vocabulary grounded in the database schema — base entity, content section and the rest — is the Domain Glossary in `app/CLAUDE.md`.

- **Basic stat block** — A content-section type (`basic-stat-block`) of a base entity: an HP number field with a text editor underneath, stored together as one JSON value in the section's content. See `features/basic-stat-block.md`.
- **HP** — In a basic stat block, the creature's hit points as written in its stat block: empty or a whole number, negatives included. It is not current HP or damage taken during an encounter.
- **Web mode** — The app run in a plain browser by `pnpm run web` (or the `web` launch configuration) against a copy of the installed release app's data, with every Tauri call answered by the dev data server; a development tool for agent sessions and the developer, never in a release build. See `features/web-dev-mode.md`.
- **Dev data server** — The Vite plugin that, in web mode, copies the installed app's database and images into a temporary folder at every start, runs the checkout's pending migrations on the copy, and serves SQL, images and every Tauri command under `/__dev-data` on Vite's own origin.
- **Platform module** — `app/platform/`, the one place every Tauri call goes through: its Tauri implementation forwards to the Tauri packages, its web implementation talks to the dev data server, and the barrel picks one by Vite's mode.
- **Fixture image** — One of three small committed images (a landscape PNG, a portrait JPEG, a square WebP) the web-mode file picker hands out in file-name order in place of a native dialog.
