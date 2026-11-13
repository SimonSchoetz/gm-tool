import { describe, it, expect } from 'vitest';
import {
  assignReasons,
  describeEntry,
  describeMutant,
  entryFor,
  findMissingEntries,
  matchLedger,
  mutantKey,
  normalizeText,
  parseArguments,
  parseLedger,
  parseReasonFile,
  serializeLedger,
  unusedKeys,
  mutantsOf,
  type LedgerEntry,
  type MutatedRanges,
  type MutationReport,
  type SourceLines,
  type LocatedMutant,
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

const survivor = (overrides: Partial<LocatedMutant> = {}): LocatedMutant => ({
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

describe('matchLedger', () => {
  it('accepts a survivor its entry names and reports nothing', () => {
    const result = matchLedger({
      entries: [entry()],
      mutants: [survivor()],
      sourceLines,
      mutatedRanges: ranges('src/NameField.tsx', [{ start: 2, end: 2 }]),
    });

    expect(result).toEqual({ unmatched: [], stale: [] });
  });

  it('lets one entry accept one survivor only, so a second identical mutant on the line is unmatched', () => {
    const twin = survivor({ column: 40 });

    const result = matchLedger({
      entries: [entry()],
      mutants: [survivor(), twin],
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

      const result = matchLedger({
        entries: [entry()],
        mutants: [other],
        sourceLines,
        mutatedRanges: ranges('src/NameField.tsx', [{ start: 2, end: 6 }]),
      });

      expect(result.unmatched).toEqual([other]);
    },
  );

  it('reports an entry as stale when the run mutated its line and its mutant did not survive', () => {
    const result = matchLedger({
      entries: [entry()],
      mutants: [],
      sourceLines,
      mutatedRanges: ranges('src/NameField.tsx', [{ start: 1, end: 3 }]),
    });

    expect(result.stale).toEqual([entry()]);
  });

  it('reports an entry as stale in a file the run mutated as a whole', () => {
    const result = matchLedger({
      entries: [entry()],
      mutants: [],
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
    const result = matchLedger({
      entries: [entry()],
      mutants: [],
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
      matchLedger({
        entries: [catchBlock],
        mutants: [],
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

    const result = matchLedger({
      entries: [edited],
      mutants: [],
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
      hangReason: null,
      acceptFile: null,
      hangFile: null,
      timeoutMS: null,
    });
  });

  it('reads --all in any position, without taking it as a file or as the reason of --accept', () => {
    expect(
      parseArguments(['src/a.ts', '--all', '--accept', 'unreachable guard']),
    ).toEqual({
      files: ['src/a.ts'],
      all: true,
      acceptReason: 'unreachable guard',
      hangReason: null,
      acceptFile: null,
      hangFile: null,
      timeoutMS: null,
    });
    expect(parseArguments(['--', '--all'])).toEqual({
      files: [],
      all: true,
      acceptReason: null,
      hangReason: null,
      acceptFile: null,
      hangFile: null,
      timeoutMS: null,
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
      hangReason: null,
      acceptFile: null,
      hangFile: null,
      timeoutMS: null,
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

  it('reads --accept-hang and --timeout-ms with their values in any position, apart from --accept and the files', () => {
    expect(
      parseArguments([
        '--timeout-ms',
        '30000',
        'src/a.ts',
        '--accept-hang',
        ' the loop never advances its index ',
        '--accept',
        'unreachable guard',
      ]),
    ).toEqual({
      files: ['src/a.ts'],
      all: false,
      acceptReason: 'unreachable guard',
      hangReason: 'the loop never advances its index',
      acceptFile: null,
      hangFile: null,
      timeoutMS: 30000,
    });
  });

  it.each([
    ['no reason', ['--accept-hang']],
    ['an option instead of a reason', ['--accept-hang', '--all']],
  ])('rejects --accept-hang with %s', (_name, argv) => {
    expect(() => parseArguments(argv)).toThrow(
      /^--accept-hang needs a reason: --accept-hang "<which loop the mutant makes endless>"$/,
    );
  });

  it('rejects --accept-hang given twice', () => {
    expect(() =>
      parseArguments(['--accept-hang', 'a', '--accept-hang', 'b']),
    ).toThrow(/^--accept-hang is given twice$/);
  });

  it.each([
    ['no value', ['--timeout-ms']],
    ['zero', ['--timeout-ms', '0']],
    ['a fraction', ['--timeout-ms', '1.5']],
    ['a word', ['--timeout-ms', 'long']],
    ['a number with a unit', ['--timeout-ms', '30s']],
  ])('rejects --timeout-ms with %s', (_name, argv) => {
    expect(() => parseArguments(argv)).toThrow(
      /^--timeout-ms needs a whole number of milliseconds: --timeout-ms <n>$/,
    );
  });

  it('rejects --timeout-ms given twice', () => {
    expect(() =>
      parseArguments(['--timeout-ms', '1', '--timeout-ms', '2']),
    ).toThrow(/^--timeout-ms is given twice$/);
  });

  it('reads --accept-from and its file in any position, without taking the file as a file argument', () => {
    expect(
      parseArguments(['src/a.ts', '--accept-from', ' reasons.json ', '--all']),
    ).toEqual({
      files: ['src/a.ts'],
      all: true,
      acceptReason: null,
      hangReason: null,
      acceptFile: 'reasons.json',
      hangFile: null,
      timeoutMS: null,
    });
  });

  it.each([
    ['no file', ['--accept-from']],
    ['an empty file name', ['--accept-from', ' ']],
    ['an option instead of a file', ['--accept-from', '--all']],
  ])('rejects --accept-from with %s', (_name, argv) => {
    expect(() => parseArguments(argv)).toThrow(
      /^--accept-from needs a file of reasons: --accept-from <file>$/,
    );
  });

  it('rejects --accept-from given twice', () => {
    expect(() =>
      parseArguments(['--accept-from', 'a', '--accept-from', 'b']),
    ).toThrow(/^--accept-from is given twice$/);
  });

  it('rejects --accept together with --accept-from, in either order', () => {
    for (const argv of [
      ['--accept', 'r', '--accept-from', 'f'],
      ['--accept-from', 'f', '--accept', 'r'],
    ])
      expect(() => parseArguments(argv)).toThrow(
        /^--accept and --accept-from exclude each other: give one reason for every mutant or one reason each$/,
      );
  });

  it('reads --accept-hang-from and its file beside --accept-from, without taking either file as a file argument', () => {
    expect(
      parseArguments([
        '--accept-hang-from',
        ' hangs.json ',
        'src/a.ts',
        '--accept-from',
        'reasons.json',
      ]),
    ).toEqual({
      files: ['src/a.ts'],
      all: false,
      acceptReason: null,
      hangReason: null,
      acceptFile: 'reasons.json',
      hangFile: 'hangs.json',
      timeoutMS: null,
    });
  });

  it('takes --accept with --accept-hang-from and --accept-hang with --accept-from', () => {
    expect(
      parseArguments(['--accept', 'r', '--accept-hang-from', 'h.json']),
    ).toMatchObject({ acceptReason: 'r', hangFile: 'h.json' });
    expect(
      parseArguments(['--accept-hang', 'loop', '--accept-from', 'f.json']),
    ).toMatchObject({ hangReason: 'loop', acceptFile: 'f.json' });
  });

  it.each([
    ['no file', ['--accept-hang-from']],
    ['an empty file name', ['--accept-hang-from', ' ']],
    ['an option instead of a file', ['--accept-hang-from', '--all']],
  ])('rejects --accept-hang-from with %s', (_name, argv) => {
    expect(() => parseArguments(argv)).toThrow(
      /^--accept-hang-from needs a file of reasons: --accept-hang-from <file>$/,
    );
  });

  it('rejects --accept-hang-from given twice', () => {
    expect(() =>
      parseArguments(['--accept-hang-from', 'a', '--accept-hang-from', 'b']),
    ).toThrow(/^--accept-hang-from is given twice$/);
  });

  it('rejects --accept-hang together with --accept-hang-from, in either order', () => {
    for (const argv of [
      ['--accept-hang', 'r', '--accept-hang-from', 'f'],
      ['--accept-hang-from', 'f', '--accept-hang', 'r'],
    ])
      expect(() => parseArguments(argv)).toThrow(
        /^--accept-hang and --accept-hang-from exclude each other: give one reason for every mutant or one reason each$/,
      );
  });
});

describe('parseReasonFile, assignReasons and unusedKeys', () => {
  const guard = survivor();
  const conditional = survivor({
    column: 7,
    mutator: 'ConditionalExpression',
    replacement: 'false',
  });
  const keyOf = (mutant: LocatedMutant) => describeMutant(mutant, () => null);

  it('keys each survivor by the text describeMutant prints before the source line', () => {
    expect(mutantKey(guard)).toBe(keyOf(guard));
    expect(keyOf(guard)).toBe(
      'app/src/NameField.tsx:2:30  StringLiteral  → "Stryker was here!"',
    );
  });

  it('pairs each survivor with the reason under its key, read with its whitespace normalized', () => {
    const reasons = parseReasonFile(
      JSON.stringify({
        'app/src/NameField.tsx:2:30 StringLiteral → "Stryker was here!"':
          ' the label renders nothing while the entry is null ',
        [keyOf(conditional)]: 'the guard returns the same empty name',
      }),
    );

    expect(assignReasons([guard, conditional], reasons, mutantKey)).toEqual({
      assigned: [
        {
          mutant: guard,
          reason: 'the label renders nothing while the entry is null',
        },
        {
          mutant: conditional,
          reason: 'the guard returns the same empty name',
        },
      ],
      missing: [],
      used: new Set([
        normalizeText(keyOf(guard)),
        normalizeText(keyOf(conditional)),
      ]),
    });
  });

  it('gives two identical survivors the one reason under their shared key', () => {
    const reasons = parseReasonFile(JSON.stringify({ [keyOf(guard)]: 'r' }));

    expect(assignReasons([guard, guard], reasons, mutantKey).assigned).toEqual([
      { mutant: guard, reason: 'r' },
      { mutant: guard, reason: 'r' },
    ]);
  });

  it('returns a survivor without a reason as missing and a key that names no survivor as unused', () => {
    const reasons = parseReasonFile(
      JSON.stringify({ [keyOf(conditional)]: 'r', 'app/src/gone.ts:1:1': 'r' }),
    );

    const result = assignReasons([guard, conditional], reasons, mutantKey);

    expect(result.missing).toEqual([guard]);
    expect(unusedKeys(reasons, result.used)).toEqual(['app/src/gone.ts:1:1']);
  });

  it('counts a key as used when any of the sets of used keys holds it', () => {
    const reasons = new Map([
      ['a', 'r'],
      ['b', 'r'],
      ['c', 'r'],
    ]);

    expect(unusedKeys(reasons, new Set(['a']), new Set(['c']))).toEqual(['b']);
    expect(unusedKeys(reasons)).toEqual(['a', 'b', 'c']);
  });

  it('gives every mutant the one reason of the command line, and none without a reason', () => {
    expect(assignReasons([guard, conditional], 'r', mutantKey)).toEqual({
      assigned: [
        { mutant: guard, reason: 'r' },
        { mutant: conditional, reason: 'r' },
      ],
      missing: [],
      used: new Set(),
    });
    expect(assignReasons([guard], null, mutantKey)).toEqual({
      assigned: null,
      missing: [],
      used: new Set(),
    });
  });

  it('keys a mutant of another shape by the key function it is given', () => {
    const reasons = parseReasonFile(JSON.stringify({ 'a  b': 'r' }));

    expect(
      assignReasons([{ name: 'a b' }], reasons, ({ name }) => name),
    ).toEqual({
      assigned: [{ mutant: { name: 'a b' }, reason: 'r' }],
      missing: [],
      used: new Set(['a b']),
    });
  });

  it.each([
    ['an array', '[]', /^the file of reasons is not a JSON object$/],
    ['null', 'null', /^the file of reasons is not a JSON object$/],
    ['a number reason', '{"k": 1}', /^the reason for "k" is not a string$/],
    ['an empty reason', '{"k": "  "}', /^the reason for "k" is empty$/],
    [
      'a reason over two lines',
      '{"k": "a\\nb"}',
      /^the reason for "k" spans more than one line$/,
    ],
    [
      'one key twice after normalizing',
      '{"a  b": "r", "a b": "s"}',
      /^"a b" is given twice$/,
    ],
  ])('rejects a file with %s', (_name, json, message) => {
    expect(() => parseReasonFile(json)).toThrow(message);
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

describe('mutantsOf', () => {
  it('returns only the mutants of the status asked for, with their replacement normalized, so a timed-out mutant is judged apart from survivors', () => {
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

    expect(mutantsOf(report, 'Survived')).toEqual([
      survivor(),
      survivor({
        line: 5,
        column: 2,
        endLine: 6,
        mutator: 'LogicalOperator',
        replacement: 'a && b',
      }),
    ]);
    expect(mutantsOf(report, 'Timeout')).toEqual([
      survivor({ mutator: 'ConditionalExpression', replacement: 'false' }),
    ]);
  });
});

describe('describeEntry and describeMutant', () => {
  it('prints a survivor as the app-relative path, position, mutator, replacement and the source line it mutates', () => {
    expect(describeMutant(survivor(), sourceLines)).toBe(
      `app/src/NameField.tsx:2:30  StringLiteral  → "Stryker was here!"  on "if (entry === null) return '';"`,
    );
  });

  it('prints a survivor without a source line when its file or line is missing', () => {
    expect(
      describeMutant(survivor({ file: 'src/Renamed.tsx' }), sourceLines),
    ).toBe('app/src/Renamed.tsx:2:30  StringLiteral  → "Stryker was here!"');
    expect(describeMutant(survivor({ line: 99 }), sourceLines)).toBe(
      'app/src/NameField.tsx:99:30  StringLiteral  → "Stryker was here!"',
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

describe('mutation-check-ledger boundaries', () => {
  it('words a malformed entry with its index, its field and the problem', () => {
    const thrownBy = (run: () => unknown) => {
      try {
        run();
      } catch (error) {
        return error;
      }
      return null;
    };

    expect(thrownBy(() => parseLedger('[1]'))).toEqual(
      new Error('ledger entry 0: entry is not an object'),
    );
    expect(thrownBy(() => parseLedger('[{"extra": 1}]'))).toEqual(
      new Error('ledger entry 0: extra is not a ledger field'),
    );
  });

  it('reads a survivor whose mutant has no replacement text as an empty replacement', () => {
    const location = {
      start: { line: 2, column: 1 },
      end: { line: 2, column: 2 },
    };
    const report = {
      files: {
        'src/NameField.tsx': {
          mutants: [
            { mutatorName: 'BlockStatement', status: 'Survived', location },
          ],
        },
      },
    } as unknown as MutationReport;

    expect(mutantsOf(report, 'Survived')[0].replacement).toBe('');
  });

  it('records an empty line text for a file that cannot be read and for a line past its end', () => {
    expect(
      entryFor(survivor({ file: 'src/missing.ts', line: 1 }), sourceLines, 'r')
        .lineText,
    ).toBe('');
    expect(
      entryFor(survivor({ line: 99, endLine: 99 }), sourceLines, 'r').lineText,
    ).toBe('');
  });

  it('reports an entry as stale when one of several mutated ranges holds its whole span', () => {
    const result = matchLedger({
      entries: [entry()],
      mutants: [],
      sourceLines,
      mutatedRanges: ranges('src/NameField.tsx', [
        { start: 8, end: 12 },
        { start: 1, end: 3 },
      ]),
    });

    expect(result.stale).toEqual([entry()]);
  });

  it('keeps an app/ in the middle of a file argument', () => {
    expect(
      parseArguments(['src/app/Thing.tsx', 'app/db/get.ts']).files,
    ).toEqual(['src/app/Thing.tsx', 'db/get.ts']);
  });
});
