import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Enforces `.claude/rules/repo-github-workflows.md`: an action from another repository is referenced by its full commit SHA with the tag or branch it stands for in a same-line comment, the form Dependabot updates together.
const GITHUB_DIR = path.resolve(import.meta.dirname, '../../.github');
const USES_LINE = /^\s*(?:-\s+)?uses:\s*(\S+)(.*)$/;
const PINNED_REF = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;
const SAME_LINE_COMMENT = /^\s+#\s+\S+\s*$/;

type UsesLine = { file: string; line: number; text: string };

const isPinnedOrLocal = (text: string): boolean => {
  const match = USES_LINE.exec(text);
  if (!match) return true;
  const [, ref, rest] = match;
  if (ref.startsWith('./')) return true;
  return PINNED_REF.test(ref) && SAME_LINE_COMMENT.test(rest);
};

const collectUsesLines = (): UsesLine[] =>
  readdirSync(GITHUB_DIR, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.ya?ml$/.test(file))
    .flatMap((file) =>
      readFileSync(path.join(GITHUB_DIR, file), 'utf8')
        .split('\n')
        .map((text, index) => ({ file, line: index + 1, text }))
        .filter(({ text }) => USES_LINE.test(text)),
    );

describe('isPinnedOrLocal', () => {
  it.each([
    'uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0',
    '      - uses: dtolnay/rust-toolchain@39008827e6b4319a349e9a42dfc90579dd25f1ca # stable',
    '    uses: ./.github/workflows/checks.yml',
    '      - uses: ./.github/actions/setup-pnpm',
  ])('accepts %s', (text) => {
    expect(isPinnedOrLocal(text)).toBe(true);
  });

  it.each([
    '      - uses: actions/checkout@v5',
    '      - uses: dtolnay/rust-toolchain@stable',
    '      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
    '      - uses: actions/checkout@fbc6f399 # v5.1.0',
    '      - uses: actions/checkout@FBC6F3992D24B796D5A048FF273F7FCC4A7B6C09 # v5.1.0',
  ])('rejects %s', (text) => {
    expect(isPinnedOrLocal(text)).toBe(false);
  });
});

describe('actions under .github/', () => {
  const usesLines = collectUsesLines();

  it('finds the uses lines of the workflows and composite actions', () => {
    expect(usesLines.length).toBeGreaterThan(0);
  });

  it('pins every action from another repository to a commit SHA with a same-line comment', () => {
    const unpinned = usesLines
      .filter(({ text }) => !isPinnedOrLocal(text))
      .map(({ file, line, text }) => `${file}:${line}: ${text.trim()}`);
    expect(unpinned).toEqual([]);
  });
});
