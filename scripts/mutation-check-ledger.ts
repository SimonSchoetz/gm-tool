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

// The file of reasons an option takes as its next argument, and the option that gives one reason to every mutant instead.
const REASON_FILE_OPTIONS = {
  '--accept-from': '--accept',
  '--accept-hang-from': '--accept-hang',
} as const;

export const parseArguments = (argv: string[]) => {
  const files: string[] = [];
  let all = false;
  const reasons: Record<keyof typeof REASON_OPTIONS, string | null> = {
    '--accept': null,
    '--accept-hang': null,
  };
  const reasonFiles: Record<keyof typeof REASON_FILE_OPTIONS, string | null> = {
    '--accept-from': null,
    '--accept-hang-from': null,
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
    const takesFile = Object.hasOwn(REASON_FILE_OPTIONS, argument);
    if (!takesFile && !Object.hasOwn(REASON_OPTIONS, argument)) {
      files.push(argument.replace(/^(\.\/)?app\//, ''));
      continue;
    }
    const given = takesFile
      ? reasonFiles[argument as keyof typeof REASON_FILE_OPTIONS]
      : reasons[argument as keyof typeof REASON_OPTIONS];
    if (given !== null) throw new Error(`${argument} is given twice`);
    if (value === null || value.trim() === '' || value.startsWith('--'))
      throw new Error(
        takesFile
          ? `${argument} needs a file of reasons: ${argument} <file>`
          : `${argument} needs a reason: ${argument} "<${REASON_OPTIONS[argument as keyof typeof REASON_OPTIONS]}>"`,
      );
    if (takesFile)
      reasonFiles[argument as keyof typeof REASON_FILE_OPTIONS] = value.trim();
    else reasons[argument as keyof typeof REASON_OPTIONS] = value.trim();
    index += 1;
  }
  for (const [fileOption, reasonOption] of Object.entries(
    REASON_FILE_OPTIONS,
  ) as [keyof typeof REASON_FILE_OPTIONS, keyof typeof REASON_OPTIONS][])
    if (reasons[reasonOption] !== null && reasonFiles[fileOption] !== null)
      throw new Error(
        `${reasonOption} and ${fileOption} exclude each other: give one reason for every mutant or one reason each`,
      );
  return {
    files,
    all,
    acceptReason: reasons['--accept'],
    hangReason: reasons['--accept-hang'],
    acceptFile: reasonFiles['--accept-from'],
    hangFile: reasonFiles['--accept-hang-from'],
    timeoutMS,
  };
};

// Names one mutant of a run: what describeMutant prints before the source line, and the key of its reason in an `--accept-from` or `--accept-hang-from` file.
export const mutantKey = ({
  file,
  line,
  column,
  mutator,
  replacement,
}: LocatedMutant) =>
  `app/${file}:${line}:${column}  ${mutator}  → ${replacement}`;

// A file of reasons (`--accept-from`, `--accept-hang-from`): a JSON object from each mutant's key to the reason it is recorded with. Keys are compared with their whitespace normalized, so a key may be typed with single spaces.
export const parseReasonFile = (json: string) => {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    throw new Error('the file of reasons is not a JSON object');
  const reasons = new Map<string, string>();
  for (const [key, reason] of Object.entries(parsed)) {
    const fail = (problem: string) =>
      new Error(`the reason for "${key}" ${problem}`);
    if (typeof reason !== 'string') throw fail('is not a string');
    if (reason.trim() === '') throw fail('is empty');
    if (reason.includes('\n')) throw fail('spans more than one line');
    const normalizedKey = normalizeText(key);
    if (reasons.has(normalizedKey)) throw new Error(`"${key}" is given twice`);
    reasons.set(normalizedKey, reason.trim());
  }
  return reasons;
};

// Where the reasons of one ledger's new entries come from: one reason for every mutant from the command line (`--accept`, `--accept-hang`), one reason each from a file (parseReasonFile), or none.
export type ReasonSource = string | ReadonlyMap<string, string> | null;

// Pairs each mutant with its reason; `assigned` is null when `source` gives none. From a file, `missing` are the mutants whose key (`keyOf`) has no reason and `used` the keys that named one, so the caller writes nothing until every mutant has a reason and every key of the file, over all the mutants it judges against that file, was used: a key left over names a mutant that moved or no longer has that outcome.
export const assignReasons = <Mutant>(
  mutants: Mutant[],
  source: ReasonSource,
  keyOf: (mutant: Mutant) => string,
) => {
  const assigned: { mutant: Mutant; reason: string }[] = [];
  const missing: Mutant[] = [];
  const used = new Set<string>();
  if (source === null) return { assigned: null, missing, used };
  for (const mutant of mutants) {
    if (typeof source === 'string') {
      assigned.push({ mutant, reason: source });
      continue;
    }
    const key = normalizeText(keyOf(mutant));
    const reason = source.get(key) ?? null;
    if (reason === null) {
      missing.push(mutant);
      continue;
    }
    used.add(key);
    assigned.push({ mutant, reason });
  }
  return { assigned, missing, used };
};

// The keys of a file of reasons that no `used` set of assignReasons holds: each names no mutant of the run, so the file was written for another one.
export const unusedKeys = (
  reasons: ReadonlyMap<string, string>,
  ...used: ReadonlySet<string>[]
) => [...reasons.keys()].filter((key) => !used.some((keys) => keys.has(key)));

// The line number is left out when the entry's line no longer resolves.
export const describeEntry = (entry: LedgerEntry, sourceLines: SourceLines) => {
  const line = resolveLine(entry, sourceLines);
  return `app/${entry.file}${line === null ? '' : `:${line}`}  ${entry.mutator}  → ${entry.replacement}  on "${entry.lineText}"${entry.occurrence > 0 ? ` (occurrence ${entry.occurrence})` : ''}`;
};

// The source line is left out when the mutant's file or line is missing.
export const describeMutant = (
  mutant: LocatedMutant,
  sourceLines: SourceLines,
) => {
  const lineText = sourceLines(mutant.file)?.[mutant.line - 1];
  return `${mutantKey(mutant)}${lineText === undefined ? '' : `  on "${normalizeText(lineText)}"`}`;
};
