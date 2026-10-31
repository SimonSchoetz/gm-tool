import { describe, it, expect } from 'vitest';
import {
  hiddenKillableMutants,
  ignoredMutantEntries,
  switchOffDisableDirectives,
  type MutantStatus,
  type MutationReport,
} from '../mutation-check-disable-audit.ts';

// The pattern of run b1: a guard whose `if (false)` mutant a test kills sits under a disable comment.
const GUARD_UNDER_COMMENT = [
  'export const record = (plan: Plan | null) => {',
  '  // Stryker disable next-line ConditionalExpression: the guard is only a type narrowing',
  '  if (plan) void recordLogEntry(plan);',
  '};',
].join('\n');

const mutant = (
  status: MutantStatus,
  line: number,
  mutatorName = 'ConditionalExpression',
  extra: { statusReason?: string } = {},
  endLine: number | null = null,
) => ({
  mutatorName,
  replacement: 'false',
  status,
  location: {
    start: { line, column: 7 },
    end: { line: endLine ?? line, column: 20 },
  },
  ...extra,
});

const report = (
  file: string,
  mutants: MutationReport['files'][string]['mutants'],
): MutationReport => ({ files: { [file]: { mutants } } });

describe('switchOffDisableDirectives', () => {
  it('keeps every line and column of the b1 pattern in place', () => {
    const switchedOff = switchOffDisableDirectives(GUARD_UNDER_COMMENT);

    expect(switchedOff.length).toBe(GUARD_UNDER_COMMENT.length);
    expect(switchedOff.split('\n')).toHaveLength(4);
    expect(switchedOff.split('\n')[2]).toBe(
      '  if (plan) void recordLogEntry(plan);',
    );
  });

  it('turns a next-line disable comment into text Stryker does not read as a directive', () => {
    const [, comment] = switchOffDisableDirectives(GUARD_UNDER_COMMENT).split(
      '\n',
    );

    expect(comment).not.toMatch(/Stryker disable/);
    expect(comment).toMatch(/^ {2}\/\/ Stryker_disable next-line /);
  });

  it.each([
    ['a range disable', '// Stryker disable StringLiteral: reason'],
    ['a block comment', '/* Stryker disable next-line Regex */'],
    ['a disable without the space after the slashes', '//Stryker disable all'],
  ])('switches off %s', (_name, comment) => {
    expect(switchOffDisableDirectives(comment)).not.toMatch(/Stryker disable/);
  });

  it('leaves restore comments and other comments alone', () => {
    const source = '// Stryker restore StringLiteral\n// disable the thing';

    expect(switchOffDisableDirectives(source)).toBe(source);
  });

  it('switches off the comment on every line it appears on', () => {
    const source = [
      '// Stryker disable next-line Regex: a',
      'const a = 1;',
      '// Stryker disable next-line Regex: b',
      'const b = 2;',
    ].join('\n');

    expect(switchOffDisableDirectives(source)).not.toMatch(/Stryker disable/);
  });
});

describe('ignoredMutantEntries', () => {
  it('lists the lines of the Ignored mutants only, per file', () => {
    const files: MutationReport = {
      files: {
        'src/a.ts': { mutants: [mutant('Killed', 3), mutant('Ignored', 4)] },
        'src/b.ts': { mutants: [mutant('Killed', 3), mutant('Survived', 4)] },
        'src/c.ts': { mutants: [] },
      },
    };

    expect(ignoredMutantEntries(files)).toEqual([
      { file: 'src/a.ts', entry: 'src/a.ts:4-4' },
    ]);
  });

  it('spans the lines of a mutant that covers several', () => {
    const files = report('src/a.ts', [
      mutant('Ignored', 4, 'BlockStatement', {}, 9),
    ]);

    expect(ignoredMutantEntries(files)).toEqual([
      { file: 'src/a.ts', entry: 'src/a.ts:4-9' },
    ]);
  });
});

describe('hiddenKillableMutants', () => {
  const reason = 'the guard is only a type narrowing';

  it('reports a mutant the real run ignored and the run with the comments off killed', () => {
    const real = report('src/record.ts', [
      mutant('Ignored', 3, 'ConditionalExpression', { statusReason: reason }),
    ]);
    const audit = report('src/record.ts', [mutant('Killed', 3)]);

    expect(hiddenKillableMutants(real, audit)).toEqual([
      {
        appRelativePath: 'src/record.ts',
        line: 3,
        column: 7,
        mutatorName: 'ConditionalExpression',
        replacement: 'false',
        reason,
      },
    ]);
  });

  it('reports a mutant the run with the comments off ended by a timeout', () => {
    const real = report('src/record.ts', [mutant('Ignored', 3)]);
    const audit = report('src/record.ts', [mutant('Timeout', 3)]);

    expect(hiddenKillableMutants(real, audit)).toHaveLength(1);
  });

  it.each(['Survived', 'NoCoverage', 'CompileError', 'RuntimeError'] as const)(
    'keeps a legitimate equivalent mutant that is %s with the comments off',
    (status) => {
      const real = report('src/record.ts', [mutant('Ignored', 3)]);
      const audit = report('src/record.ts', [mutant(status, 3)]);

      expect(hiddenKillableMutants(real, audit)).toEqual([]);
    },
  );

  it('does not report a mutant the real run itself killed', () => {
    const real = report('src/record.ts', [mutant('Killed', 3)]);
    const audit = report('src/record.ts', [mutant('Killed', 3)]);

    expect(hiddenKillableMutants(real, audit)).toEqual([]);
  });

  it('matches a mutant by its position, mutator and replacement, not by its line alone', () => {
    const real = report('src/record.ts', [
      mutant('Ignored', 3, 'EqualityOperator'),
    ]);
    const audit = report('src/record.ts', [
      mutant('Killed', 3, 'ConditionalExpression'),
      mutant('Killed', 4, 'EqualityOperator'),
    ]);

    expect(hiddenKillableMutants(real, audit)).toEqual([]);
  });

  it('matches a mutant by its file', () => {
    const real = report('src/a.ts', [mutant('Ignored', 3)]);
    const audit = report('src/b.ts', [mutant('Killed', 3)]);

    expect(hiddenKillableMutants(real, audit)).toEqual([]);
  });

  it('reports each hidden mutant of a line once', () => {
    const real = report('src/record.ts', [
      mutant('Ignored', 3, 'EqualityOperator'),
      mutant('Ignored', 3, 'ConditionalExpression'),
    ]);
    const audit = report('src/record.ts', [
      mutant('Killed', 3, 'EqualityOperator'),
      mutant('Survived', 3, 'ConditionalExpression'),
    ]);

    expect(hiddenKillableMutants(real, audit)).toHaveLength(1);
  });
});
