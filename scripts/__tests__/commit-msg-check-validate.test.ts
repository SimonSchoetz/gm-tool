import { describe, it, expect } from 'vitest';
import { commitMessageRefusal } from '../commit-msg-check-validate.ts';

const ALLOWED_TYPES = [
  'feat',
  'fix',
  'refactor',
  'chore',
  'docs',
  'test',
  'style',
  'perf',
];

const EXPECTED_FORM = 'Expected form: <type>(<scope>): <description>';

const refusalOf = (
  message: string,
  branch: string,
  { editorOpened } = { editorOpened: false },
) => commitMessageRefusal({ message, branch, editorOpened });

describe('commitMessageRefusal', () => {
  it.each(ALLOWED_TYPES)(
    'accepts the type %s with the branch scope, whatever the type of the branch',
    (type) => {
      expect(refusalOf(`${type}(example): add x`, 'feat/example')).toBeNull();
    },
  );

  it('refuses another scope on a typed branch and names the one the branch requires', () => {
    expect(refusalOf('feat(other): add x', 'feat/example')).toBe(
      [
        'commit-msg-check: refused "feat(other): add x": "other" is not the scope of this branch.',
        EXPECTED_FORM,
        `Types: ${ALLOWED_TYPES.join(', ')}`,
        'Scope required on this branch: example',
      ].join('\n'),
    );
  });

  it('requires everything after the first slash as the scope, not only the next segment', () => {
    expect(refusalOf('feat(a/b): add x', 'feat/a/b')).toBeNull();
    expect(refusalOf('feat(a): add x', 'feat/a/b')).toContain(
      'Scope required on this branch: a/b',
    );
  });

  it.each([
    'main',
    '',
    'claude/some-worktree',
    'feature/example',
    'user/feat/example',
  ])(
    'accepts any scope on the branch "%s", which does not begin with a type and a slash',
    (branch) => {
      expect(refusalOf('feat(anything): add x', branch)).toBeNull();
    },
  );

  it.each([
    ['feature(example): add x', 'feat/example', 'feature'],
    ['feature(example): add x', 'main', 'feature'],
    ['claude(some-worktree): add x', 'claude/some-worktree', 'claude'],
  ])(
    'refuses "%s" on %s for its type and lists the eight allowed ones',
    (message, branch, type) => {
      const refusal = refusalOf(message, branch);

      expect(refusal).toContain(`"${type}" is not an allowed type`);
      expect(refusal).toContain(`Types: ${ALLOWED_TYPES.join(', ')}`);
    },
  );

  it.each([
    'update backlog',
    'feat: add x',
    'feat(): add x',
    'feat( ): add x',
    'feat(\t): add x',
    'feat((example)): add x',
    'feat(example)!: add x',
    'feat(example):add x',
    'feat(example):',
    'feat(example):    ',
    ' feat(example): add x',
    'fixup! feat(example): add x',
  ])('refuses "%s", which does not have the form', (message) => {
    expect(refusalOf(message, 'feat/example')).toContain(
      'it does not have the expected form',
    );
  });

  it('accepts a scope with spaces among other characters, since only a blank one is no scope', () => {
    expect(refusalOf('feat( dev server ): add x', 'main')).toBeNull();
  });

  it('states the refused subject and the form, and names no scope on a branch that requires none', () => {
    expect(refusalOf('update backlog', 'main')).toBe(
      [
        'commit-msg-check: refused "update backlog": it does not have the expected form.',
        EXPECTED_FORM,
        `Types: ${ALLOWED_TYPES.join(', ')}`,
      ].join('\n'),
    );
  });

  it.each([
    "Merge branch 'x'",
    "Merge branch 'i', tag 't1'",
    "Merge branches 'a' and 'b' into feat/example",
    "Merge remote-tracking branch 'origin/main' into feat/example",
    "Merge remote-tracking branches 'up/c' and 'up/d'",
    "Merge tag 'v1'",
    "Merge tags 't1' and 't2'",
    "Merge commit 'b93a8e0'",
    "Merge commits 'b93a8e0' and '4c6dd12' of ../remote",
    'Revert "Merge pull request #1 from o/feat/y"',
    'Reapply "update backlog"',
  ])('accepts the subject git writes itself: %s', (message) => {
    expect(refusalOf(message, 'feat/example')).toBeNull();
  });

  it.each([
    'Merge https://example.com/repository',
    'Squashed commit of the following:',
    'Merge the two modules',
    "update Merge branch 'x'",
    'Revert the last change',
  ])('refuses "%s", which no merge or revert exemption covers', (message) => {
    expect(refusalOf(message, 'main')).toContain(
      'it does not have the expected form',
    );
  });

  it('checks the first non-blank line, so a valid body line does not rescue a plain subject', () => {
    expect(
      refusalOf('\n\nadd x\n\nfeat(example): body line\n', 'main'),
    ).toContain('refused "add x"');
  });

  it('reads no line after the subject, so a body is free of the form', () => {
    expect(
      refusalOf('\nfeat(example): add x\n\nplain body line\n', 'main'),
    ).toBeNull();
  });

  it('skips the comment lines git drops when an editor was opened', () => {
    expect(
      refusalOf(
        '# Please enter the commit message\n#\nfeat(example): add x\n',
        'feat/example',
        { editorOpened: true },
      ),
    ).toBeNull();
  });

  it('checks a leading # line when no editor was opened, since git records it as the subject', () => {
    expect(
      refusalOf(
        '#12 broken subject\n\nfeat(example): body line\n',
        'feat/example',
      ),
    ).toContain('refused "#12 broken subject"');
  });

  it('refuses a message that holds no subject line', () => {
    expect(
      refusalOf('\n# Changes to be committed:\n', 'main', {
        editorOpened: true,
      }),
    ).toContain('refused ""');
  });

  it('leaves trailing whitespace out of the subject, so a CRLF message file is not refused', () => {
    expect(refusalOf('feat(example): add x\r\n', 'feat/example')).toBeNull();
  });
});
