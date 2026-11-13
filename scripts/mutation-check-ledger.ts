// The ledgers behind scripts/mutation-check.ts: reading and writing scripts/mutation-accepted.json (accepted survivors) and scripts/mutation-hangs.json (timed-out mutants confirmed to hang, which count as caught), and matching a Stryker run's mutants of one status against one of them.
// An entry names one mutant by its file, mutator, replacement and the normalized text of the line that holds its start; `occurrence` counts the earlier lines of the file with the same text, so two identical lines stay apart, and identical mutants on one line are repeated entries, matched one mutant per entry.
// Pure: the script reads and writes the files and passes their contents in.

type MutantStatus =
  | 'Killed'
  | 'Survived'
  | 'NoCoverage'
  | 'CompileError'
  | 'RuntimeError'
  | 'Timeout'
  | 'Ignored'
  | 'Pending';

type ReportedMutant = {
  mutatorName: string;
  replacement?: string;
  status: MutantStatus;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
};

export type MutationReport = {
  files: Record<string, { mutants: ReportedMutant[] }>;
};

// eslint-disable-next-line local/no-unused-exports -- tests type the ledger entries they build
export type LedgerEntry = {
  file: string;
  mutator: string;
  replacement: string;
  lineText: string;
  occurrence: number;
  lines: number;
  reason: string;
};

// A mutant of a run with the status a ledger judges: `Survived` for scripts/mutation-accepted.json, `Timeout` for scripts/mutation-hangs.json.
// eslint-disable-next-line local/no-unused-exports -- tests type the mutants they build
export type LocatedMutant = {
  file: string;
  line: number;
  column: number;
  endLine: number;
  mutator: string;
  replacement: string;
};

// A file's lines (1-based through `lines[line - 1]`), or null when the file does not exist.
export type SourceLines = (file: string) => string[] | null;

// The lines a run mutated per file, as inclusive intervals; "all" for a file mutated as a whole.
export type MutatedRanges = Map<
  string,
  { start: number; end: number }[] | 'all'
>;

const ENTRY_KEYS = [
  'file',
  'mutator',
  'replacement',
  'lineText',
  'occurrence',
  'lines',
  'reason',
] as const;

// eslint-disable-next-line local/no-unused-exports -- tests pin the whitespace normalization entries and source lines share
export const normalizeText = (text: string) => text.trim().replace(/\s+/g, ' ');

export const parseLedger = (json: string): LedgerEntry[] => {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('the ledger is not a JSON array');
  return parsed.map((value: unknown, index) => {
    const fail = (field: string, problem: string) =>
      new Error(`ledger entry ${index}: ${field} ${problem}`);
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw fail('entry', 'is not an object');
    const entry = value as Record<string, unknown>;
    for (const key of Object.keys(entry)) {
      if (!(ENTRY_KEYS as readonly string[]).includes(key))
        throw fail(key, 'is not a ledger field');
    }
    const text = (field: (typeof ENTRY_KEYS)[number]) => {
      const fieldValue = entry[field];
      if (typeof fieldValue !== 'string')
        throw fail(field, 'is missing or not a string');
      if (fieldValue === '') throw fail(field, 'is empty');
      return fieldValue;
    };
    const integer = (field: (typeof ENTRY_KEYS)[number], minimum: number) => {
      const fieldValue = entry[field];
      if (typeof fieldValue !== 'number' || !Number.isInteger(fieldValue))
        throw fail(field, 'is missing or not an integer');
      if (fieldValue < minimum) throw fail(field, `is below ${minimum}`);
      return fieldValue;
    };
    const file = text('file');
    if (file.startsWith('app/') || file.startsWith('/'))
      throw fail('file', 'must be relative to app/');
    const replacement = text('replacement');
    const lineText = text('lineText');
    for (const [field, fieldValue] of [
      ['replacement', replacement],
      ['lineText', lineText],
    ] as const) {
      if (fieldValue !== normalizeText(fieldValue))
        throw fail(field, 'is not normalized');
    }
    const reason = text('reason');
    if (reason.includes('\n')) throw fail('reason', 'spans more than one line');
    return {
      file,
      mutator: text('mutator'),
      replacement,
      lineText,
      occurrence: integer('occurrence', 0),
      lines: integer('lines', 1),
      reason,
    };
  });
};

// The numbers of the lines whose normalized text is `lineText`, in file order; an entry's `occurrence` indexes this list.
const linesWithText = (fileLines: string[], lineText: string) =>
  fileLines.flatMap((sourceLine, index) =>
    normalizeText(sourceLine) === lineText ? [index + 1] : [],
  );

// The line number an entry stands for, or null when the file or that line is missing.
const resolveLine = (entry: LedgerEntry, sourceLines: SourceLines) => {
  const fileLines = sourceLines(entry.file);
  if (fileLines === null) return null;
  return linesWithText(fileLines, entry.lineText)[entry.occurrence] ?? null;
};

// The lines an entry's mutant spans, or null when the file or the entry's line is missing.
export const entrySpan = (entry: LedgerEntry, sourceLines: SourceLines) => {
  const line = resolveLine(entry, sourceLines);
  return line === null ? null : { start: line, end: line + entry.lines - 1 };
};

export const serializeLedger = (
  entries: LedgerEntry[],
  sourceLines: SourceLines,
) => {
  const sortLine = (entry: LedgerEntry) =>
    resolveLine(entry, sourceLines) ?? Infinity;
  const sorted = [...entries].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      sortLine(a) - sortLine(b) ||
      a.mutator.localeCompare(b.mutator) ||
      a.replacement.localeCompare(b.replacement),
  );
  return `${JSON.stringify(sorted, null, 2)}\n`;
};

export const mutantsOf = (
  report: MutationReport,
  wanted: Extract<MutantStatus, 'Survived' | 'Timeout'>,
): LocatedMutant[] =>
  Object.entries(report.files).flatMap(([file, { mutants }]) =>
    mutants
      .filter(({ status }) => status === wanted)
      .map(({ mutatorName, replacement, location }) => ({
        file,
        line: location.start.line,
        column: location.start.column,
        endLine: location.end.line,
        mutator: mutatorName,
        replacement: normalizeText(replacement ?? ''),
      })),
  );

export const entryFor = (
  mutant: LocatedMutant,
  sourceLines: SourceLines,
  reason: string,
): LedgerEntry => {
  const fileLines = sourceLines(mutant.file) ?? [];
  const lineText = normalizeText(fileLines[mutant.line - 1] ?? '');
  return {
    file: mutant.file,
    mutator: mutant.mutator,
    replacement: mutant.replacement,
    lineText,
    occurrence: linesWithText(fileLines, lineText).indexOf(mutant.line),
    lines: mutant.endLine - mutant.line + 1,
    reason,
  };
};

export const findMissingEntries = (
  entries: LedgerEntry[],
  sourceLines: SourceLines,
) => entries.filter((entry) => resolveLine(entry, sourceLines) === null);

const keyOf = ({
  file,
  mutator,
  replacement,
  lineText,
  occurrence,
}: Omit<LedgerEntry, 'lines' | 'reason'>) =>
  JSON.stringify([file, mutator, replacement, lineText, occurrence]);

// A ledgered mutant still runs: a mutant of the ledger's status consumes one entry with its key, a mutant left over is unmatched, and an entry left over whose whole span this run mutated is stale, since its mutant was created and no longer has that status.
export const matchLedger = ({
  entries,
  mutants,
  sourceLines,
  mutatedRanges,
}: {
  entries: LedgerEntry[];
  mutants: LocatedMutant[];
  sourceLines: SourceLines;
  mutatedRanges: MutatedRanges;
}) => {
  const unconsumed = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    const key = keyOf(entry);
    unconsumed.set(key, [...(unconsumed.get(key) ?? []), entry]);
  }
  const unmatched = mutants.filter((mutant) => {
    const candidates =
      unconsumed.get(keyOf(entryFor(mutant, sourceLines, ''))) ?? [];
    return candidates.shift() === undefined;
  });
  const stale = [...unconsumed.values()].flat().filter((entry) => {
    const ranges = mutatedRanges.get(entry.file) ?? null;
    if (ranges === null) return false;
    const span = entrySpan(entry, sourceLines);
    if (span === null) return false;
    if (ranges === 'all') return true;
    return ranges.some(
      ({ start, end }) => start <= span.start && span.end <= end,
    );
  });
  return { unmatched, stale };
};

// The reason an option takes as its next argument, which it describes as `<placeholder>`.
const REASON_OPTIONS = {
  '--accept': 'why no test can observe the mutant',
  '--accept-hang': 'which loop the mutant makes endless',
} as const;

export const parseArguments = (argv: string[]) => {
  const files: string[] = [];
  let all = false;
  const reasons: Record<keyof typeof REASON_OPTIONS, string | null> = {
    '--accept': null,
    '--accept-hang': null,
  };
  let timeoutMS: number | null = null;
  // pnpm may forward the `--` separator as an argument.
  const rest = argv.filter((argument) => argument !== '--');
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    const value = rest.at(index + 1) ?? null;
    if (argument === '--all') {
      all = true;
      continue;
    }
    if (argument === '--timeout-ms') {
      if (timeoutMS !== null) throw new Error('--timeout-ms is given twice');
      const milliseconds = Number(value);
      if (!Number.isSafeInteger(milliseconds) || milliseconds < 1)
        throw new Error(
          '--timeout-ms needs a whole number of milliseconds: --timeout-ms <n>',
        );
      timeoutMS = milliseconds;
      index += 1;
      continue;
    }
    if (!Object.hasOwn(REASON_OPTIONS, argument)) {
      files.push(argument.replace(/^(\.\/)?app\//, ''));
      continue;
    }
    const option = argument as keyof typeof REASON_OPTIONS;
    if (reasons[option] !== null) throw new Error(`${option} is given twice`);
    if (value === null || value.trim() === '' || value.startsWith('--'))
      throw new Error(
        `${option} needs a reason: ${option} "<${REASON_OPTIONS[option]}>"`,
      );
    reasons[option] = value.trim();
    index += 1;
  }
  return {
    files,
    all,
    acceptReason: reasons['--accept'],
    hangReason: reasons['--accept-hang'],
    timeoutMS,
  };
};

// The line number is left out when the entry's line no longer resolves.
export const describeEntry = (entry: LedgerEntry, sourceLines: SourceLines) => {
  const line = resolveLine(entry, sourceLines);
  return `app/${entry.file}${line === null ? '' : `:${line}`}  ${entry.mutator}  → ${entry.replacement}  on "${entry.lineText}"${entry.occurrence > 0 ? ` (occurrence ${entry.occurrence})` : ''}`;
};

// The source line is left out when the mutant's file or line is missing.
export const describeMutant = (
  { file, line, column, mutator, replacement }: LocatedMutant,
  sourceLines: SourceLines,
) => {
  const lineText = sourceLines(file)?.[line - 1];
  return `app/${file}:${line}:${column}  ${mutator}  → ${replacement}${lineText === undefined ? '' : `  on "${normalizeText(lineText)}"`}`;
};
