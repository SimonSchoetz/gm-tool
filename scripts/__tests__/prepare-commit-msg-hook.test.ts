import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync, rmSync } from 'fs';
import path from 'path';
import { commitMessageRefusal } from '../commit-msg-check-validate.ts';
import { unsetGitEnvironment } from './support/isolated-git.ts';
import {
  createScratchFolder,
  initRepositoryOnFeatExample,
  writeMessageFile,
} from './support/scratch-repository.ts';

const HOOK = path.resolve(
  import.meta.dirname,
  '../../.githooks/prepare-commit-msg',
);

describe('.githooks/prepare-commit-msg on a typed branch', () => {
  let repository: string;

  beforeEach(() => {
    unsetGitEnvironment();
    repository = createScratchFolder();
    initRepositoryOnFeatExample(repository);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(repository, { recursive: true, force: true });
  });

  const prepare = (message: string) => {
    const file = writeMessageFile(repository, message);
    // The second argument is the source git names for `git revert --no-edit` and for `git commit -m`.
    execFileSync(HOOK, [file, 'message'], { cwd: repository });
    return readFileSync(file, 'utf8');
  };

  it.each([
    'Revert "Merge pull request #1 from o/feat/y"\n\nThis reverts commit abc.\n',
    'Reapply "update backlog"\n\nThis reverts commit abc.\n',
  ])(
    'leaves a revert message as git wrote it, in a form the commit check accepts: %s',
    (message) => {
      const prepared = prepare(message);

      expect(prepared).toBe(message);
      expect(
        commitMessageRefusal({
          message: prepared,
          branch: 'feat/example',
          editorOpened: false,
        }),
      ).toBeNull();
    },
  );

  it.each(['add x', 'Revert the last change', 'Reapply the last change'])(
    'still prefixes the branch type and scope to the plain subject "%s"',
    (subject) => {
      expect(prepare(`${subject}\n`)).toBe(`feat(example): ${subject}`);
    },
  );
});
