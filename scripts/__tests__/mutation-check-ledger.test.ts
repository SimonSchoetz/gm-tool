import { describe, it, expect } from 'vitest';
import {
  describeEntry,
  describeSurvivor,
  entryFor,
  findMissingEntries,
  matchSurvivors,
  normalizeText,
  parseArguments,
  parseLedger,
  serializeLedger,
  survivorsOf,
  type LedgerEntry,
  type MutatedRanges,
  type MutationReport,
  type SourceLines,
  type Survivor,
} from '../mutation-check-ledger.ts';

// The same guard line in two functions, and a catch block spanning three lines.
const NAME_FIELD = [
  'export const shownName = (entry: Entry | null) => {',
  "  if (entry === null) return '';",
  '  return entry.name;',
  '};',
  'export const automaticName = (entry: Entry | null) => {',
  "  if (entry === null) return '';",
  '  try {',
  '    return parse(entry.automaticName);',
  '  } catch {',
  '    return null;',
  '  }',
  '};',
];

const sourcesOf =
  (files: Record<string, string[]>): SourceLines =>
  (file) =>
    files[file] ?? null;

const sourceLines = sourcesOf({ 'src/NameField.tsx': NAME_FIELD });

const survivor = (overrides: Partial<Survivor> = {}): Survivor => ({
  file: 'src/NameField.tsx',
  line: 2,
  column: 30,
  endLine: 2,
  mutator: 'StringLiteral',
  replacement: '"Stryker was here!"',
  ...overrides,
});

const entry = (overrides: Partial<LedgerEntry> = {}): LedgerEntry => ({
  ...entryFor(
    survivor(),
    sourceLines,
    'the field renders nothing while the entry is null',
  ),
  ...overrides,
});

const ranges = (
  file: string,
  value: { start: number; end: number }[] | 'all',
): MutatedRanges => new Map([[file, value]]);

describe('normalizeText', () => {
  it('trims and collapses whitespace so a re-indented or reflowed line keeps its key', () => {
    expect(normalizeText('  if (a)\t &&   b  ')).toBe('if (a) && b');
  });
});

describe('parseLedger', () => {
  it('returns the entries of a well-formed ledger', () => {
    const entries = [entry()];

    expect(parseLedger(JSON.stringify(entries))).toEqual(entries);
  });

  it('rejects a ledger that is not an array', () => {
    expect(() => parseLedger('{}')).toThrow(/^the ledger is not a JSON array$/);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'entry'],
  ])('rejects an entry that is %s, naming the entry', (_name, value) => {
    expect(() => parseLedger(JSON.stringify([entry(), value]))).toThrow(
      /^ledger entry 1: entry is not an object$/,
    );
  });

  it.each([
    [
      'a missing key',
      { reason: undefined },
      'reason is missing or not a string',
    ],
    ['an extra key', { line: 3 }, 'line is not a ledger field'],
    [
      'a wrong type',
      { occurrence: '0' },
      'occurrence is missing or not an integer',
    ],
    ['a negative occurrence', { occurrence: -1 }, 'occurrence is below 0'],
    [
      'a fractional occurrence',
      { occurrence: 0.5 },
      'occurrence is missing or not an integer',
    ],
    ['lines below 1', { lines: 0 }, 'lines is below 1'],
    ['an empty reason', { reason: '' }, 'reason is empty'],
    ['an empty file', { file: '' }, 'file is empty'],
    ['an empty mutator', { mutator: '' }, 'mutator is empty'],
    ['an empty line text', { lineText: '' }, 'lineText is empty'],
    ['an empty replacement', { replacement: '' }, 'replacement is empty'],
    [
      'a reason over two lines',
      { reason: 'a\nb' },
      'reason spans more than one line',
    ],
    [
      'a line text that is not normalized',
      { lineText: ' const a = 1;' },
      'lineText is not normalized',
    ],
    [
      'a replacement that is not normalized',
      { replacement: 'a  b' },
      'replacement is not normalized',
    ],
    [
      'a file under app/',
      { file: 'app/src/NameField.tsx' },
      'file must be relative to app/',
    ],
    [
      'an absolute file',
      { file: '/src/NameField.tsx' },
      'file must be relative to app/',
    ],
  ])(
    'rejects %s, naming the entry and the field',
    (_name, overrides, message) => {
      const json = JSON.stringify([entry(), { ...entry(), ...overrides }]);

      expect(() => parseLedger(json)).toThrow(`ledger entry 1: ${message}`);
    },
  );
});

describe('entryFor', () => {
  it('counts the earlier identical lines, so two identical fallbacks get their own entries', () => {
    const first = entryFor(survivor({ line: 2 }), sourceLines, 'r');
    const second = entryFor(survivor({ line: 6 }), sourceLines, 'r');

    expect(first.lineText).toBe("if (entry === null) return '';");
    expect(first.occurrence).toBe(0);
    expect(second.lineText).toBe(first.lineText);
    expect(second.occurrence).toBe(1);
  });

  it('records how many lines a multi-line mutant spans', () => {
    const catchBlock = survivor({
      line: 9,
      endLine: 11,
      mutator: 'BlockStatement',
      replacement: '{}',
    });

    expect(entryFor(catchBlock, sourceLines, 'r').lines).toBe(3);
  });
});

describe('findMissingEntries', () => {
  it('reports an entry whose file no longer exists', () => {
    const moved = entry({ file: 'src/Renamed.tsx' });

    expect(findMissingEntries([entry(), moved], sourceLines)).toEqual([moved]);
  });

  it('reports an entry whose line no longer exists as often as its occurrence needs', () => {
    const third = entry({ occurrence: 2 });

    expect(
      findMissingEntries([entry({ occurrence: 1 }), third], sourceLines),
    ).toEqual([third]);
  });

  it('reports an entry whose line was edited', () => {
    const edited = entry({ lineText: "if (entry === undefined) return '';" });

    expect(findMissingEntries([edited], sourceLines)).toEqual([edited]);
  });
});

describe('matchSurvivors', () => {
  it('accepts a survivor its entry names and reports nothing', () => {
    const result = matchSurvivors({
      entries: [entry()],
      survivors: [survivor()],
      sourceLines,
      mutatedRanges: ranges('src/NameField.tsx', [{ start: 2, end: 2 }]),
    });

    expect(result).toEqual({ unmatched: [], stale: [] });
  });

  it('lets one entry accept one survivor only, so a second identical mutant on the line is unmatched', () => {
    const twin = survivor({ column: 40 });

    const result = matchSurvivors({
      entries: [entry()],
      survivors: [survivor(), twin],
      sourceLines,
      mutatedRanges: ranges('src/NameField.tsx', [{ start: 2, end: 2 }]),
    });

    expect(result.unmatched).toEqual([twin]);
  });

  it.each([
    ['another mutator', { mutator: 'ConditionalExpression' }],
    ['another replacement', { replacement: '""' }],
    ['the identical line further down', { line: 6 }],
  ])(
    'does not accept a survivor that differs from the entry by %s',
    (_name, overrides) => {
      const other = survivor(overrides);

      const result = matchSurvivors({
        entries: [entry()],
        survivors: [other],
        sourceLines,
        mutatedRanges: ranges('src/NameField.tsx', [{ start: 2, end: 6 }]),
      });

      expect(result.unmatched).toEqual([other]);
    },
  );

  it('reports an entry as stale when the run mutated its line and its mutant did not survive', () => {
    const result = matchSurvivors({
      entries: [entry()],
      survivors: [],
      sourceLines,
      mutatedRanges: ranges('src/NameField.tsx', [{ start: 1, end: 3 }]),
    });

    expect(result.stale).toEqual([entry()]);
  });

  it('reports an entry as stale in a file the run mutated as a whole', () => {
    const result = matchSurvivors({
      entries: [entry()],
      survivors: [],
      sourceLines,
      mutatedRanges: ranges('src/NameField.tsx', 'all'),
    });

    expect(result.stale).toEqual([entry()]);
  });

  it.each([
    [
      'its line lies outside the ranges',
      ranges('src/NameField.tsx', [{ start: 3, end: 5 }]),
    ],
    ['its file was not mutated', ranges('src/Other.tsx', 'all')],
  ])('does not report an entry as stale when %s', (_name, mutatedRanges) => {
    const result = matchSurvivors({
      entries: [entry()],
      survivors: [],
      sourceLines,
      mutatedRanges,
    });

    expect(result.stale).toEqual([]);
  });

  it('reports a multi-line entry as stale only when one range covers its whole span', () => {
    const catchBlock = entryFor(
      survivor({
        line: 9,
        endLine: 11,
        mutator: 'BlockStatement',
        replacement: '{}',
      }),
      sourceLines,
      'r',
    );
    const staleUnder = (mutatedRanges: MutatedRanges) =>
      matchSurvivors({
        entries: [catchBlock],
        survivors: [],
        sourceLines,
        mutatedRanges,
      }).stale;

    expect(
      staleUnder(ranges('src/NameField.tsx', [{ start: 9, end: 10 }])),
    ).toEqual([]);
    expect(
      staleUnder(
        ranges('src/NameField.tsx', [
          { start: 9, end: 9 },
          { start: 10, end: 11 },
        ]),
      ),
    ).toEqual([]);
    expect(
      staleUnder(ranges('src/NameField.tsx', [{ start: 9, end: 11 }])),
    ).toEqual([catchBlock]);
  });

  it('never reports an entry whose line no longer resolves as stale, since it is missing instead', () => {
    const edited = entry({ lineText: 'const gone = 1;' });

    const result = matchSurvivors({
      entries: [edited],
      survivors: [],
      sourceLines,
      mutatedRanges: ranges('src/NameField.tsx', 'all'),
    });

    expect(result.stale).toEqual([]);
  });
});

describe('parseArguments', () => {
  it('drops the -- separator and strips ./app/ and app/ from files', () => {
    expect(
      parseArguments(['--', './app/src/a.ts', 'app/src/b.ts', 'src/c.ts']),
    ).toEqual({
      files: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      all: false,
      acceptReason: null,
    });
  });

  it('reads --all in any position, without taking it as a file or as the reason of --accept', () => {
    expect(
      parseArguments(['src/a.ts', '--all', '--accept', 'unreachable guard']),
    ).toEqual({
      files: ['src/a.ts'],
      all: true,
      acceptReason: 'unreachable guard',
    });
    expect(parseArguments(['--', '--all'])).toEqual({
      files: [],
      all: true,
      acceptReason: null,
    });
  });

  it('reads --accept and its reason in any position, without taking the reason as a file', () => {
    expect(
      parseArguments([
        'src/a.ts',
        '--accept',
        ' unreachable guard ',
        'src/b.ts',
      ]),
    ).toEqual({
      files: ['src/a.ts', 'src/b.ts'],
      all: false,
      acceptReason: 'unreachable guard',
    });
  });

  it.each([
    ['no reason', ['--accept']],
    ['an empty reason', ['--accept', '  ']],
    ['an option instead of a reason', ['--accept', '--accept', 'r']],
  ])('rejects --accept with %s', (_name, argv) => {
    expect(() => parseArguments(argv)).toThrow(
      /^--accept needs a reason: --accept "<why no test can observe the mutant>"$/,
    );
  });

  it('rejects --accept given twice', () => {
    expect(() => parseArguments(['--accept', 'a', '--accept', 'b'])).toThrow(
      /^--accept is given twice$/,
    );
  });
});

describe('serializeLedger', () => {
  it('orders entries by file, line, mutator and replacement, unresolved lines last, as two-space JSON with a final newline', () => {
    const atLine6 = entry({ occurrence: 1 });
    const conditional = entry({
      mutator: 'ConditionalExpression',
      replacement: 'true',
    });
    const emptyString = entry({ replacement: '""' });
    const unresolved = entry({ lineText: 'const gone = 1;' });
    const otherFile = entry({ file: 'domain/a.ts' });
    const shuffled = [
      unresolved,
      atLine6,
      otherFile,
      entry(),
      emptyString,
      conditional,
    ];

    const serialized = serializeLedger(shuffled, sourceLines);

    expect(JSON.parse(serialized)).toEqual([
      otherFile,
      conditional,
      emptyString,
      entry(),
      atLine6,
      unresolved,
    ]);
    expect(serialized).toBe(
      `${JSON.stringify(JSON.parse(serialized), null, 2)}\n`,
    );
  });

  it('writes an empty ledger as [] and a newline', () => {
    expect(serializeLedger([], sourceLines)).toBe('[]\n');
  });
});

describe('survivorsOf', () => {
  it('returns only the surviving mutants, with their replacement normalized', () => {
    const location = {
      start: { line: 2, column: 30 },
      end: { line: 2, column: 32 },
    };
    const report: MutationReport = {
      files: {
        'src/NameField.tsx': {
          mutants: [
            {
              mutatorName: 'StringLiteral',
              replacement: '"Stryker was here!"',
              status: 'Survived',
              location,
            },
            {
              mutatorName: 'ConditionalExpression',
              replacement: 'true',
              status: 'Killed',
              location,
            },
            {
              mutatorName: 'ConditionalExpression',
              replacement: 'false',
              status: 'Timeout',
              location,
            },
            {
              mutatorName: 'BlockStatement',
              replacement: '{}',
              status: 'NoCoverage',
              location,
            },
            {
              mutatorName: 'LogicalOperator',
              replacement: 'a  &&\n  b',
              status: 'Survived',
              location: {
                start: { line: 5, column: 2 },
                end: { line: 6, column: 4 },
              },
            },
          ],
        },
      },
    };

    expect(survivorsOf(report)).toEqual([
      survivor(),
      survivor({
        line: 5,
        column: 2,
        endLine: 6,
        mutator: 'LogicalOperator',
        replacement: 'a && b',
      }),
    ]);
  });
});

describe('describeEntry and describeSurvivor', () => {
  it('prints a survivor as the app-relative path, position, mutator and replacement', () => {
    expect(describeSurvivor(survivor())).toBe(
      'app/src/NameField.tsx:2:30  StringLiteral  → "Stryker was here!"',
    );
  });

  it('prints an entry with its resolved line and occurrence, and without a line once it no longer resolves', () => {
    expect(describeEntry(entry({ occurrence: 1 }), sourceLines)).toBe(
      `app/src/NameField.tsx:6  StringLiteral  → "Stryker was here!"  on "if (entry === null) return '';" (occurrence 1)`,
    );
    expect(describeEntry(entry({ file: 'src/Renamed.tsx' }), sourceLines)).toBe(
      `app/src/Renamed.tsx  StringLiteral  → "Stryker was here!"  on "if (entry === null) return '';"`,
    );
  });
});
