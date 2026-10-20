import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// A fresh directory under the OS temp root for a test that writes files; the test calls `remove` in `afterEach`.
export const createTempDirectory = (): { dir: string; remove: () => void } => {
  const dir = mkdtempSync(join(tmpdir(), 'gm-tool-dev-data-server-'));
  return {
    dir,
    remove: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
};
