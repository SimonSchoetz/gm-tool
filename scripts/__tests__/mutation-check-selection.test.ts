import { describe, it, expect, vi } from 'vitest';
import {
  isProductionSource,
  lineRangesFor,
  selectFiles,
  testFileCandidates,
} from '../mutation-check-selection.ts';
import {
  entryFor,
  entrySpan,
  matchLedger,
  type MutatedRanges,
  type SourceLines,
} from '../mutation-check-ledger.ts';

describe('isProductionSource', () => {
  it.each([
    'src/hooks/useSyncedInputValue.ts',
    'src/data-access-layer/mergeUpdate.ts',
    'src/screens/adventure/helper/sortSessions.ts',
    'services/adventureService.ts',
    'domain/adventures/validate.ts',
    'db/adventure/create.ts',
    'platform/tauriPlatform.ts',
    'util/getDateString.ts',
  ])('accepts %s', (file) => {
    expect(isProductionSource(file)).toBe(true);
  });

  it.each([
    ['a component file', 'src/components/Button/Button.tsx'],
    ['a screen file', 'src/screens/adventure/AdventureScreen.tsx'],
    ['a dev data server file', 'dev-data-server/vitePlugin.ts'],
    ['an ESLint rule file', 'eslint-rules/no-import-past-index.js'],
    ['an ESLint rule helper', 'eslint-rules/helper.ts'],
    ['a JavaScript file', 'src/legacy.js'],
    ['a declaration file', 'src/types/historyState.d.ts'],
    ['a test file', 'util/__tests__/getDateString.test.ts'],
    ['the generated route tree', 'src/routeTree.gen.ts'],
    ['a path outside the production directories', 'docs/example.ts'],
    ['a stylesheet', 'src/App/App.css'],
  ])('rejects %s', (_name, file) => {
    expect(isProductionSource(file)).toBe(false);
  });
});

describe('testFileCandidates', () => {
  it('names the .test.ts and .test.tsx files in the source folder __tests__', () => {
    expect(testFileCandidates('src/hooks/useThing.ts')).toEqual([
      'src/hooks/__tests__/useThing.test.ts',
      'src/hooks/__tests__/useThing.test.tsx',
    ]);
  });
});

describe('selectFiles', () => {
  const changedPaths = ['util/b.ts', 'util/a.ts', 'util/__tests__/a.test.ts'];
  const trackedPaths = [
    'util/a.ts',
    'util/b.ts',
    'util/c.ts',
    'util/c.ts',
    'src/types/x.d.ts',
  ];
  const lists = (all: boolean) => {
    const listChangedPaths = vi.fn(() => changedPaths);
    const listTrackedPaths = vi.fn(() => trackedPaths);
    return {
      all,
      listChangedPaths,
      listTrackedPaths,
    };
  };

  it('without all, selects only the changed production sources, sorted, and never lists the tracked ones', () => {
    const input = lists(false);

    expect(selectFiles({ ...input, requestedFiles: [] }).selected).toEqual([
      'util/a.ts',
      'util/b.ts',
    ]);
    expect(input.listTrackedPaths).not.toHaveBeenCalled();
  });

  it('with all, selects every tracked production source once and never lists the changed ones', () => {
    const input = lists(true);

    expect(selectFiles({ ...input, requestedFiles: [] }).selected).toEqual([
      'util/a.ts',
      'util/b.ts',
      'util/c.ts',
    ]);
    expect(input.listChangedPaths).not.toHaveBeenCalled();
  });

  it('selects the requested files among the candidates, with all too', () => {
    expect(
      selectFiles({ ...lists(true), requestedFiles: ['util/c.ts'] }).selected,
    ).toEqual(['util/c.ts']);
    expect(
      selectFiles({ ...lists(false), requestedFiles: ['util/a.ts'] }).selected,
    ).toEqual(['util/a.ts']);
  });

  it('returns a requested file that is no candidate as unknown', () => {
    const result = selectFiles({
      ...lists(false),
      requestedFiles: ['util/a.ts', 'util/c.ts', 'src/types/x.d.ts'],
    });
    expect(result.unknown).toEqual(['util/c.ts', 'src/types/x.d.ts']);
    expect(result.selected).toEqual(['util/a.ts']);
  });
});

describe('lineRangesFor', () => {
  const changedLines = new Map([
    ['app/util/a.ts', [{ start: 3, end: 5 }]],
    ['app/util/untouched.ts', []],
  ]);
  const untrackedPaths = new Set(['app/util/new.ts']);
  const rangesOf = (appRelativePath: string, all = false) =>
    lineRangesFor({
      all,
      appRelativePath,
      untrackedPaths,
      changedLines,
      ledgerSpans: () => [{ start: 20, end: 21 }],
    });

  it('joins the ledger spans of a changed file to its changed lines', () => {
    expect(rangesOf('util/a.ts')).toEqual([
      { start: 3, end: 5 },
      { start: 20, end: 21 },
    ]);
  });

  it('gives no line for a file the branch did not change, though it has ledger entries', () => {
    expect(rangesOf('util/other.ts')).toEqual([]);
  });

  it('gives only the ledger spans for a changed file with no line added or changed', () => {
    expect(rangesOf('util/untouched.ts')).toEqual([{ start: 20, end: 21 }]);
  });

  it('gives the whole file for an untracked file', () => {
    expect(rangesOf('util/new.ts')).toBe('all');
  });

  it('gives the whole file for every file under all', () => {
    expect(rangesOf('util/a.ts', true)).toBe('all');
    expect(rangesOf('util/other.ts', true)).toBe('all');
  });
});

describe('lineRangesFor joining ranges', () => {
  const rangesWith = (
    changed: { start: number; end: number }[],
    spans: { start: number; end: number }[],
  ) =>
    lineRangesFor({
      all: false,
      appRelativePath: 'util/a.ts',
      untrackedPaths: new Set(),
      changedLines: new Map([['app/util/a.ts', changed]]),
      ledgerSpans: () => spans,
    });

  it('joins a ledger span that crosses a changed range into one range, so the stale check sees its whole span mutated', () => {
    expect(rangesWith([{ start: 5, end: 8 }], [{ start: 3, end: 6 }])).toEqual([
      { start: 3, end: 8 },
    ]);
  });

  it('keeps the end of a range that contains the next one', () => {
    expect(rangesWith([{ start: 2, end: 10 }], [{ start: 4, end: 5 }])).toEqual(
      [{ start: 2, end: 10 }],
    );
  });

  it('joins adjacent ranges and keeps ranges with a line between them apart, in line order', () => {
    expect(
      rangesWith(
        [
          { start: 11, end: 11 },
          { start: 6, end: 7 },
        ],
        [{ start: 8, end: 9 }],
      ),
    ).toEqual([
      { start: 6, end: 9 },
      { start: 11, end: 11 },
    ]);
  });

  it("leaves the caller's changed lines as they were when it joins a span into them", () => {
    const changed = [{ start: 5, end: 8 }];

    rangesWith(changed, [{ start: 8, end: 12 }]);

    expect(changed).toEqual([{ start: 5, end: 8 }]);
  });
});

describe('lineRangesFor with matchLedger: ledger entries in the files a branch touched', () => {
  // A guard on line 2 accepted as equivalent, and a change on line 5 the branch made.
  const GUARDED = [
    'export const label = (value: string | null) => {',
    "  if (value === null) return '';",
    '  return value;',
    '};',
    'export const changed = 1;',
  ];
  const sourceLines: SourceLines = (file) =>
    file === 'util/touched.ts' || file === 'util/untouched.ts' ? GUARDED : null;
  const guardEntry = (file: string) =>
    entryFor(
      {
        file,
        line: 2,
        column: 30,
        endLine: 2,
        mutator: 'StringLiteral',
        replacement: '"Stryker was here!"',
      },
      sourceLines,
      'the label renders nothing while the value is null',
    );
  const ledger = [
    guardEntry('util/touched.ts'),
    guardEntry('util/untouched.ts'),
  ];
  const changedLines = new Map([
    ['app/util/touched.ts', [{ start: 5, end: 5 }]],
  ]);
  // What scripts/mutation-check.ts mutates for the changed files: their changed lines and their entries' spans.
  const mutatedRanges: MutatedRanges = new Map(
    ['util/touched.ts', 'util/untouched.ts'].map((file) => [
      file,
      lineRangesFor({
        all: false,
        appRelativePath: file,
        untrackedPaths: new Set(),
        changedLines,
        ledgerSpans: (spanFile) =>
          ledger
            .filter((entry) => entry.file === spanFile)
            .map((entry) => entrySpan(entry, sourceLines))
            .filter((span) => span !== null),
      }),
    ]),
  );
  const survivorOn = (file: string) => ({
    file,
    line: 2,
    column: 30,
    endLine: 2,
    mutator: 'StringLiteral',
    replacement: '"Stryker was here!"',
  });

  it('fails an entry in a touched file whose mutant no longer survives as stale, though the branch changed another line', () => {
    const result = matchLedger({
      entries: ledger,
      mutants: [survivorOn('util/untouched.ts')],
      sourceLines,
      mutatedRanges,
    });

    expect(result.stale).toEqual([guardEntry('util/touched.ts')]);
  });

  it('does not mutate an entry in a file the branch did not touch, so it is never stale', () => {
    expect(mutatedRanges.get('util/untouched.ts')).toEqual([]);
    expect(
      matchLedger({ entries: ledger, mutants: [], sourceLines, mutatedRanges })
        .stale,
    ).not.toContainEqual(guardEntry('util/untouched.ts'));
  });

  it('passes an entry in a touched file whose mutant still survives', () => {
    const result = matchLedger({
      entries: ledger,
      mutants: [survivorOn('util/touched.ts')],
      sourceLines,
      mutatedRanges,
    });

    expect(result).toEqual({ unmatched: [], stale: [] });
  });
});
