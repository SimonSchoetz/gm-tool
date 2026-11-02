// The ledger of accepted survivors behind scripts/mutation-check.ts: reading and writing scripts/mutation-accepted.json, and matching a Stryker run's survivors against it.
// An entry names one mutant by its file, mutator, replacement and the normalized text of the line that holds its start; `occurrence` counts the earlier lines of the file with the same text, so two identical lines stay apart, and identical mutants on one line are repeated entries, matched one survivor per entry.
// Pure: the script reads and writes the files and passes their contents in.

type MutantStatus = "Killed" | "Survived" | "NoCoverage" | "CompileError" | "RuntimeError" | "Timeout" | "Ignored" | "Pending";

type ReportedMutant = {
  mutatorName: string;
  replacement?: string;
  status: MutantStatus;
  location: { start: { line: number; column: number }; end: { line: number; column: number } };
};

export type MutationReport = {
  files: Record<string, { mutants: ReportedMutant[] }>;
};

export type LedgerEntry = {
  file: string;
  mutator: string;
  replacement: string;
  lineText: string;
  occurrence: number;
  lines: number;
  reason: string;
};

export type Survivor = {
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
export type MutatedRanges = Map<string, { start: number; end: number }[] | "all">;

const ENTRY_KEYS = ["file", "mutator", "replacement", "lineText", "occurrence", "lines", "reason"] as const;

export const normalizeText = (text: string) => text.trim().replace(/\s+/g, " ");

export const parseLedger = (json: string): LedgerEntry[] => {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error("the ledger is not a JSON array");
  return parsed.map((value: unknown, index) => {
    const fail = (field: string, problem: string) => new Error(`ledger entry ${index}: ${field} ${problem}`);
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw fail("entry", "is not an object");
    const entry = value as Record<string, unknown>;
    for (const key of Object.keys(entry)) {
      if (!(ENTRY_KEYS as readonly string[]).includes(key)) throw fail(key, "is not a ledger field");
    }
    const text = (field: (typeof ENTRY_KEYS)[number]) => {
      const fieldValue = entry[field];
      if (typeof fieldValue !== "string") throw fail(field, "is missing or not a string");
      if (fieldValue === "") throw fail(field, "is empty");
      return fieldValue;
    };
    const integer = (field: (typeof ENTRY_KEYS)[number], minimum: number) => {
      const fieldValue = entry[field];
      if (typeof fieldValue !== "number" || !Number.isInteger(fieldValue)) throw fail(field, "is missing or not an integer");
      if (fieldValue < minimum) throw fail(field, `is below ${minimum}`);
      return fieldValue;
    };
    const file = text("file");
    if (file.startsWith("app/") || file.startsWith("/")) throw fail("file", "must be relative to app/");
    const replacement = text("replacement");
    const lineText = text("lineText");
    for (const [field, fieldValue] of [["replacement", replacement], ["lineText", lineText]] as const) {
      if (fieldValue !== normalizeText(fieldValue)) throw fail(field, "is not normalized");
    }
    const reason = text("reason");
    if (reason.includes("\n")) throw fail("reason", "spans more than one line");
    return { file, mutator: text("mutator"), replacement, lineText, occurrence: integer("occurrence", 0), lines: integer("lines", 1), reason };
  });
};

// The line number an entry stands for: the (`occurrence` + 1)th line of its file with its text, or null when the file or that line is missing.
const resolveLine = (entry: LedgerEntry, sourceLines: SourceLines) => {
  const fileLines = sourceLines(entry.file);
  if (fileLines === null) return null;
  let seen = 0;
  for (const [index, sourceLine] of fileLines.entries()) {
    if (normalizeText(sourceLine) !== entry.lineText) continue;
    if (seen === entry.occurrence) return index + 1;
    seen += 1;
  }
  return null;
};

export const serializeLedger = (entries: LedgerEntry[], sourceLines: SourceLines) => {
  const sortLine = (entry: LedgerEntry) => resolveLine(entry, sourceLines) ?? Infinity;
  const sorted = [...entries].sort(
    (a, b) =>
      a.file.localeCompare(b.file) || sortLine(a) - sortLine(b) || a.mutator.localeCompare(b.mutator) || a.replacement.localeCompare(b.replacement),
  );
  return `${JSON.stringify(sorted, null, 2)}\n`;
};

export const survivorsOf = (report: MutationReport): Survivor[] =>
  Object.entries(report.files).flatMap(([file, { mutants }]) =>
    mutants
      .filter(({ status }) => status === "Survived")
      .map(({ mutatorName, replacement, location }) => ({
        file,
        line: location.start.line,
        column: location.start.column,
        endLine: location.end.line,
        mutator: mutatorName,
        replacement: normalizeText(replacement ?? ""),
      })),
  );

export const entryFor = (survivor: Survivor, sourceLines: SourceLines, reason: string): LedgerEntry => {
  const fileLines = sourceLines(survivor.file) ?? [];
  const lineText = normalizeText(fileLines[survivor.line - 1] ?? "");
  const occurrence = fileLines.slice(0, survivor.line - 1).filter((sourceLine) => normalizeText(sourceLine) === lineText).length;
  return {
    file: survivor.file,
    mutator: survivor.mutator,
    replacement: survivor.replacement,
    lineText,
    occurrence,
    lines: survivor.endLine - survivor.line + 1,
    reason,
  };
};

export const findMissingEntries = (entries: LedgerEntry[], sourceLines: SourceLines) => entries.filter((entry) => resolveLine(entry, sourceLines) === null);

const keyOf = ({ file, mutator, replacement, lineText, occurrence }: Omit<LedgerEntry, "lines" | "reason">) =>
  JSON.stringify([file, mutator, replacement, lineText, occurrence]);

// An accepted mutant still runs: a survivor consumes one entry with its key, a survivor left over is unmatched, and an entry left over whose whole span this run mutated is stale, since its mutant was created and did not survive.
export const matchSurvivors = ({
  entries,
  survivors,
  sourceLines,
  mutatedRanges,
}: {
  entries: LedgerEntry[];
  survivors: Survivor[];
  sourceLines: SourceLines;
  mutatedRanges: MutatedRanges;
}) => {
  const unconsumed = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    const key = keyOf(entry);
    unconsumed.set(key, [...(unconsumed.get(key) ?? []), entry]);
  }
  const unmatched = survivors.filter((survivor) => {
    const candidates = unconsumed.get(keyOf(entryFor(survivor, sourceLines, ""))) ?? [];
    return candidates.shift() === undefined;
  });
  const stale = [...unconsumed.values()].flat().filter((entry) => {
    const ranges = mutatedRanges.get(entry.file);
    if (ranges === undefined) return false;
    const line = resolveLine(entry, sourceLines);
    if (line === null) return false;
    if (ranges === "all") return true;
    const lastLine = line + entry.lines - 1;
    return ranges.some(({ start, end }) => start <= line && lastLine <= end);
  });
  return { unmatched, stale };
};

export const parseArguments = (argv: string[]) => {
  const files: string[] = [];
  let acceptReason: string | null = null;
  // pnpm may forward the `--` separator as an argument.
  const rest = argv.filter((argument) => argument !== "--");
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument !== "--accept") {
      files.push(argument.replace(/^(\.\/)?app\//, ""));
      continue;
    }
    if (acceptReason !== null) throw new Error("--accept is given twice");
    const reason = rest[index + 1];
    if (reason === undefined || reason.trim() === "" || reason.startsWith("--")) throw new Error('--accept needs a reason: --accept "<why no test can observe the mutant>"');
    acceptReason = reason.trim();
    index += 1;
  }
  return { files, acceptReason };
};

// The line number is left out when the entry's line no longer resolves.
export const describeEntry = (entry: LedgerEntry, sourceLines: SourceLines) => {
  const line = resolveLine(entry, sourceLines);
  return `app/${entry.file}${line === null ? "" : `:${line}`}  ${entry.mutator}  → ${entry.replacement}  on "${entry.lineText}"${entry.occurrence > 0 ? ` (occurrence ${entry.occurrence})` : ""}`;
};

export const describeSurvivor = ({ file, line, column, mutator, replacement }: Survivor) => `app/${file}:${line}:${column}  ${mutator}  → ${replacement}`;
