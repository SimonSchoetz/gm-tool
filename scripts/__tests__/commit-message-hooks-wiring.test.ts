import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawnSync } from 'child_process';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { unsetGitEnvironment } from './support/isolated-git.ts';
import {
  createScratchFolder,
  initRepositoryOnFeatExample,
  writeMessageFile,
} from './support/scratch-repository.ts';

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../..');

const { 'simple-git-hooks': hooks } = JSON.parse(
  readFileSync(path.join(REPOSITORY_ROOT, 'package.json'), 'utf8'),
) as {
  'simple-git-hooks': { 'prepare-commit-msg': string; 'commit-msg': string };
};

describe('the commit message hook commands of package.json', () => {
  let checkout: string;

  beforeEach(() => {
    unsetGitEnvironment();
    checkout = createScratchFolder();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(checkout, { recursive: true, force: true });
  });

  const addCheckScript = () => {
    mkdirSync(path.join(checkout, 'scripts'));
    for (const script of [
      'commit-msg-check.ts',
      'commit-msg-check-validate.ts',
    ]) {
      copyFileSync(
        path.join(REPOSITORY_ROOT, 'scripts', script),
        path.join(checkout, 'scripts', script),
      );
    }
    writeFileSync(path.join(checkout, 'package.json'), '{"type":"module"}');
  };

  // Git passes each of these two hooks the path of the message file as its first argument. The folder name holds a space, as a path to a git directory can.
  const runHook = (
    hook: keyof typeof hooks,
    message: string,
    ...furtherArguments: string[]
  ) => {
    const gitDirectory = path.join(checkout, 'git directory');
    mkdirSync(gitDirectory, { recursive: true });
    const file = writeMessageFile(gitDirectory, message);
    const result = spawnSync(
      'sh',
      ['-c', hooks[hook], hook, file, ...furtherArguments],
      { cwd: checkout, encoding: 'utf8' },
    );
    return { ...result, file };
  };

  const addPrefixHook = () => {
    initRepositoryOnFeatExample(checkout);
    mkdirSync(path.join(checkout, '.githooks'));
    copyFileSync(
      path.join(REPOSITORY_ROOT, '.githooks', 'prepare-commit-msg'),
      path.join(checkout, '.githooks', 'prepare-commit-msg'),
    );
  };

  it('hands prepare-commit-msg a message path with a space whole, so the message is prefixed', () => {
    addPrefixHook();

    const { status, file } = runHook(
      'prepare-commit-msg',
      'add x\n',
      'message',
    );

    expect(status).toBe(0);
    expect(readFileSync(file, 'utf8')).toBe('feat(example): add x');
  });

  it('hands prepare-commit-msg the source git names, so a merge message is not prefixed', () => {
    addPrefixHook();

    const { status, file } = runHook('prepare-commit-msg', 'add x\n', 'merge');

    expect(status).toBe(0);
    expect(readFileSync(file, 'utf8')).toBe('add x\n');
  });

  it('lets any commit through in silence in a checkout without the check script, which shares the installed hook', () => {
    expect(runHook('commit-msg', 'update backlog\n')).toMatchObject({
      status: 0,
      stdout: '',
      stderr: '',
    });
  });

  it('refuses a subject outside the form once the check script is in the checkout', () => {
    addCheckScript();

    const { status, stderr } = runHook('commit-msg', 'update backlog\n');

    expect(status).toBe(1);
    expect(stderr).toContain('refused "update backlog"');
  });

  it('lets a subject in the form through once the check script is in the checkout', () => {
    addCheckScript();

    expect(runHook('commit-msg', 'chore(backlog): update it\n')).toMatchObject({
      status: 0,
      stderr: '',
    });
  });
});
