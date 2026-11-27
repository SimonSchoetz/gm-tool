import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawnSync } from 'child_process';
import { readFileSync, rmSync } from 'fs';
import path from 'path';
import { unsetGitEnvironment } from './support/isolated-git.ts';
import {
  createScratchFolder,
  initRepositoryOnFeatExample,
  writeMessageFile,
} from './support/scratch-repository.ts';

const SCRIPT = path.resolve(import.meta.dirname, '../commit-msg-check.ts');

// A subject git records only when no editor was opened, above a line that has the form.
const COMMENT_LIKE_SUBJECT = '#12 broken subject\n\nfeat(example): body line\n';

describe('commit-msg-check', () => {
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

  const check = (message: string) => {
    const file = writeMessageFile(repository, message);
    const { status, stdout, stderr } = spawnSync(
      process.execPath,
      [SCRIPT, file],
      { cwd: repository, encoding: 'utf8' },
    );
    return { status, stdout, stderr, file };
  };

  it('exits 1 with the refusal on standard error, judged against the current branch, and leaves the message file as it was', () => {
    const { status, stdout, stderr, file } = check('feat(other): add x\n');

    expect(status).toBe(1);
    expect(stderr).toContain('Scope required on this branch: example');
    expect(stdout).toBe('');
    expect(readFileSync(file, 'utf8')).toBe('feat(other): add x\n');
  });

  it('exits 0 and prints nothing for a subject it accepts', () => {
    expect(check('feat(example): add x\n')).toMatchObject({
      status: 0,
      stdout: '',
      stderr: '',
    });
  });

  it('checks form and type but no scope where git names no branch, as on a detached HEAD', () => {
    // Without the repository `git symbolic-ref` exits non-zero, as it does on a detached HEAD.
    rmSync(path.join(repository, '.git'), { recursive: true });

    expect(check('feat(other): add x\n')).toMatchObject({
      status: 0,
      stderr: '',
    });
    expect(check('add x\n').status).toBe(1);
    expect(check('feature(other): add x\n').stderr).toContain(
      '"feature" is not an allowed type',
    );
  });

  it('checks a leading # line when git signals that no editor opens', () => {
    vi.stubEnv('GIT_EDITOR', ':');

    const { status, stderr } = check(COMMENT_LIKE_SUBJECT);

    expect(status).toBe(1);
    expect(stderr).toContain('refused "#12 broken subject"');
  });

  it('skips a leading # line when an editor was opened', () => {
    expect(check(COMMENT_LIKE_SUBJECT).status).toBe(0);
  });
});
