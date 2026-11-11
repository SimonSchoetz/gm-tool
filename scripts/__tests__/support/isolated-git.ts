// Git exports GIT_DIR, GIT_INDEX_FILE and other GIT_* variables to the hooks it runs, so a test run by a commit hook inherits them, and a git command meant for a scratch repository acts on the repository the hook runs for: in a worktree's pre-commit hook, `git init` in a scratch folder re-initialised the real repository and turned its shared config bare.
import { vi } from 'vitest';

// Unsets every GIT_* variable for the current test, so git and every unit that spawns it find the repository from their working directory; `vi.unstubAllEnvs()` restores them.
export const unsetGitEnvironment = () => {
  for (const name of Object.keys(process.env)) {
    if (name.startsWith('GIT_')) vi.stubEnv(name, undefined);
  }
};
