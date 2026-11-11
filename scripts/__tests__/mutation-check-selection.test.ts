import { describe, it, expect } from 'vitest';
import {
  isProductionSource,
  lineRangesFor,
  selectFiles,
  testFileCandidates,
} from '../mutation-check-selection.ts';

describe('isProductionSource', () => {
  it.each([
    'src/screens/adventure/AdventureScreen.tsx',
    'services/adventureService.ts',
    'domain/adventures/validate.ts',
    'db/adventure/create.ts',
    'dev-data-server/vitePlugin.ts',
    'platform/tauriPlatform.ts',
    'util/getDateString.ts',
    'eslint-rules/no-import-past-index.js',
    'eslint-rules/helper.ts',
  ])('accepts %s', (file) => {
    expect(isProductionSource(file)).toBe(true);
  });

  it.each([
    ['a JavaScript file outside eslint-rules', 'src/legacy.js'],
    ['a declaration file', 'src/types/historyState.d.ts'],
    ['a test file', 'util/__tests__/getDateString.test.ts'],
    ['a rule test file', 'eslint-rules/__tests__/no-unused-exports.test.js'],
    ['the generated route tree', 'src/routeTree.gen.ts'],
    ['a path outside the production directories', 'docs/example.ts'],
    ['a stylesheet', 'src/App/App.css'],
  ])('rejects %s', (_name, file) => {
    expect(isProductionSource(file)).toBe(false);
  });
});

describe('testFileCandidates', () => {
  it('names the .test.ts and .test.tsx files in the source folder __tests__ for a TypeScript source', () => {
    expect(testFileCandidates('src/components/Button/Button.tsx')).toEqual([
      'src/components/Button/__tests__/Button.test.ts',
      'src/components/Button/__tests__/Button.test.tsx',
    ]);
  });

  it('adds the .test.js file for an eslint-rules source only', () => {
    expect(testFileCandidates('eslint-rules/no-unused-exports.js')).toEqual([
      'eslint-rules/__tests__/no-unused-exports.test.ts',
      'eslint-rules/__tests__/no-unused-exports.test.tsx',
      'eslint-rules/__tests__/no-unused-exports.test.js',
    ]);
    expect(testFileCandidates('util/getDateString.ts')).not.toContain(
      'util/__tests__/getDateString.test.js',
    );
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

  it('without all, selects only the changed production sources, sorted', () => {
    expect(
      selectFiles({
        all: false,
        changedPaths,
        trackedPaths,
        requestedFiles: [],
      }).selected,
    ).toEqual(['util/a.ts', 'util/b.ts']);
  });

  it('with all, selects every tracked production source once and ignores the changed list', () => {
    expect(
      selectFiles({
        all: true,
        changedPaths: [],
        trackedPaths,
        requestedFiles: [],
      }).selected,
    ).toEqual(['util/a.ts', 'util/b.ts', 'util/c.ts']);
  });

  it('selects the requested files among the candidates, with all too', () => {
    const request = ['util/c.ts'];
    expect(
      selectFiles({
        all: true,
        changedPaths,
        trackedPaths,
        requestedFiles: request,
      }).selected,
    ).toEqual(['util/c.ts']);
    expect(
      selectFiles({
        all: false,
        changedPaths,
        trackedPaths,
        requestedFiles: ['util/a.ts'],
      }).selected,
    ).toEqual(['util/a.ts']);
  });

  it('returns a requested file that is no candidate as unknown', () => {
    const result = selectFiles({
      all: false,
      changedPaths,
      trackedPaths,
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
    lineRangesFor({ all, appRelativePath, untrackedPaths, changedLines });

  it('gives the changed lines of a changed file', () => {
    expect(rangesOf('util/a.ts')).toEqual([{ start: 3, end: 5 }]);
  });

  it('gives no line for a file the branch did not change', () => {
    expect(rangesOf('util/other.ts')).toEqual([]);
  });

  it('gives the whole file for an untracked file', () => {
    expect(rangesOf('util/new.ts')).toBe('all');
  });

  it('gives the whole file for every file under all', () => {
    expect(rangesOf('util/a.ts', true)).toBe('all');
    expect(rangesOf('util/other.ts', true)).toBe('all');
  });
});

describe('isProductionSource in the JavaScript directory', () => {
  it('accepts a .js rule file and refuses a file with no extension or another one', () => {
    expect(isProductionSource('eslint-rules/no-thing.js')).toBe(true);
    expect(isProductionSource('eslint-rules/README')).toBe(false);
    expect(isProductionSource('eslint-rules/no-thing.json')).toBe(false);
  });
});
