// Node host — the first half of the `dev` script in package.json, run by `node` before `tauri dev`; its relative imports carry the `.ts` extension Node's type stripping requires. A non-zero exit code from mirrorFromProcess stops the `&&` before the dev app starts on stale data.
import { mirrorFromProcess } from './startDevMirror.ts';

process.exitCode = await mirrorFromProcess(process);
