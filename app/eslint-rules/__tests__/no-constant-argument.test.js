// @vitest-environment node

// @ts-check
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { findConstantArguments } from '../no-constant-argument.js';

/**
 * Analyses an in-memory project: `files` maps absolute posix paths to source text; a relative specifier resolves through the compiler's own bundler resolution, and no default library is loaded, so a declaration file gives `String` the one signature the cases call, typing what it returns as a `string` that cannot be `undefined`.
 * @param {Record<string, string>} projectFiles
 * @returns {string[]} each finding as `<file>:<messageId>:<function>.<name>` followed by the reported text
 */
const findingsIn = (projectFiles) => {
  /** @type {Record<string, string>} */
  const files = {
    '/p/globals.d.ts': 'declare function String(value: unknown): string;',
    ...projectFiles,
  };
  /** @type {import('typescript').CompilerOptions} */
  const options = {
    noLib: true,
    strict: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
  };
  const host = ts.createCompilerHost(options);
  host.fileExists = (fileName) => fileName in files;
  host.readFile = (fileName) => files[fileName];
  host.directoryExists = (directory) =>
    Object.keys(files).some((fileName) => fileName.startsWith(`${directory}/`));
  host.getCurrentDirectory = () => '/p';
  host.getSourceFile = (fileName, languageVersion) =>
    fileName in files
      ? ts.createSourceFile(fileName, files[fileName], languageVersion, true)
      : undefined;
  const program = ts.createProgram(Object.keys(files), options, host);
  return [...findConstantArguments(program)].flatMap(([fileName, findings]) =>
    findings.map(
      ({ start, end, messageId, data }) =>
        `${fileName}:${messageId}:${data.function}.${data.name} ${files[fileName].slice(start, end)}`,
    ),
  );
};

describe('findConstantArguments', () => {
  it('reports a parameter every call passes the same literal, and none whose values differ', () => {
    expect(
      findingsIn({
        '/p/f.ts':
          'export const f = (raw: string, min: number) => raw.length > min;',
        '/p/a.ts':
          "import { f } from './f'; f('a', 0); f(String(1), 0); f('b', -0);",
        '/p/g.ts':
          'export function g(n: number) { return n; } g(1); g(2); g(-1);',
      }),
    ).toEqual(['/p/f.ts:alwaysSame:f.min min: number']);
  });

  it('reports a parameter every call omits or passes as undefined, with or without a default', () => {
    expect(
      findingsIn({
        '/p/f.ts':
          'export const f = (raw: string, max = Infinity, label?: string) => [raw, max, label]; f(String(1)); f(String(2), undefined, void 0);',
      }),
    ).toEqual([
      '/p/f.ts:alwaysOmitted:f.max max = Infinity',
      '/p/f.ts:alwaysOmitted:f.label label?: string',
    ]);
  });

  it('reports a default no call lets apply, and none once a call omits the argument', () => {
    expect(
      findingsIn({
        '/p/f.ts':
          "const used = (a: string, b = 'x') => a + b; used(String(1), String(2)); used(String(3), String(4));",
        '/p/g.ts':
          "const kept = (a: string, b = 'x') => a + b; kept(String(1)); kept(String(2), String(3));",
      }),
    ).toEqual(["/p/f.ts:defaultNeverUsed:used.b 'x'"]);
  });

  it('counts no call site in a test file, and reports nothing declared in one', () => {
    expect(
      findingsIn({
        '/p/f.ts':
          'export const f = (raw: string, max = Infinity) => raw.length < max; f(String(1));',
        '/p/__tests__/f.test.ts':
          "import { f } from '../f'; f('a', 3); const local = (n: number) => n; local(1); local(1);",
      }),
    ).toEqual(['/p/f.ts:alwaysOmitted:f.max max = Infinity']);
  });

  it('reports nothing for a function without a production call', () => {
    expect(
      findingsIn({
        '/p/f.ts': 'export const f = (n: number) => n;',
        '/p/__tests__/f.test.ts': "import { f } from '../f'; f(1); f(1);",
      }),
    ).toEqual([]);
  });

  it('skips a function a production file hands on as a value, but not one only exported, typed or imported', () => {
    expect(
      findingsIn({
        '/p/f.ts':
          'export const handedOn = (n: number) => n; export const typed = (n: number) => n; handedOn(1); typed(1); type T = typeof typed; const list = [handedOn];',
        '/p/index.ts': "export { typed } from './f';",
      }),
    ).toEqual(['/p/f.ts:alwaysSame:typed.n n: number']);
  });

  it('reads calls through a namespace import, a barrel and a shorthand property hand-on as such', () => {
    expect(
      findingsIn({
        '/p/m/impl.ts': 'export const f = (n: number) => n;',
        '/p/m/index.ts': "export { f } from './impl';",
        '/p/a.ts': "import * as m from './m'; m.f(2);",
        '/p/b.ts': "import { f } from './m'; f(2);",
        '/p/g.ts':
          'const g = (n: number) => n; g(1); export const handlers = { g };',
      }),
    ).toEqual(['/p/m/impl.ts:alwaysSame:f.n n: number']);
  });

  it('treats a module-level const fixed by its source as one value, and one computed at run time or held locally as none', () => {
    expect(
      findingsIn({
        '/p/constants.ts': [
          'export const MAX_ZOOM = 4;',
          'export const LIMITS = { max: 2 * MAX_ZOOM, names: ["a", `b`] } as const;',
          'export enum Mode { A }',
          'const read = () => 1;',
          'export const COMPUTED = read();',
          'export const SPREAD = [...LIMITS.names];',
          'export const SELF: number = SELF;',
        ].join('\n'),
        '/p/f.ts': [
          "import { COMPUTED, LIMITS, MAX_ZOOM, Mode, SELF, SPREAD } from './constants';",
          'const byConst = (n: number) => n; byConst(MAX_ZOOM); byConst((MAX_ZOOM));',
          'const byProperty = (n: number) => n; byProperty(LIMITS.max); byProperty(LIMITS.max);',
          'const byEnum = (m: Mode) => m; byEnum(Mode.A); byEnum(Mode.A);',
          'const byComputed = (n: number) => n; byComputed(COMPUTED); byComputed(COMPUTED);',
          'const bySpread = (n: unknown) => n; bySpread(SPREAD); bySpread(SPREAD);',
          'const bySelf = (n: number) => n; bySelf(SELF); bySelf(SELF);',
          'const byLocal = (n: number) => n; const run = () => { const local = 1; byLocal(local); byLocal(local); }; run();',
          'const byKeyword = (b: boolean | null) => b; byKeyword(true); byKeyword(true);',
          'const byNull = (b: boolean | null) => b; byNull(null); byNull(false);',
        ].join('\n'),
      }),
    ).toEqual([
      '/p/f.ts:alwaysSame:byConst.n n: number',
      '/p/f.ts:alwaysSame:byProperty.n n: number',
      '/p/f.ts:alwaysSame:byEnum.m m: Mode',
      '/p/f.ts:alwaysSame:byKeyword.b b: boolean | null',
    ]);
  });

  it('reads a destructured parameter property from an object literal argument, and nothing from another argument or behind a spread', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'const f = ({ a, b = 1, c }: { a: number; b?: number; c?: number }) => a + b + (c ?? 0);',
          'f({ a: 1, b: 2 }); f({ a: 1, b: 3 });',
          'const g = ({ a }: { a: number }) => a; const o = { a: 1 }; g(o); g({ a: 1 });',
          'const h = ({ a }: { a: number }) => a; h({ ...{ a: 1 } }); h({ a: 1 });',
          'const k = (x: number, ...rest: number[]) => x + rest.length; const xs = [1]; k(...xs); k(1);',
          "const s = ({ a }: { a: number }) => a; const a = 1; s({ a }); s({ 'a': 1 });",
        ].join('\n'),
      }),
    ).toEqual([
      '/p/f.ts:alwaysSame:f.a a',
      '/p/f.ts:defaultNeverUsed:f.b 1',
      '/p/f.ts:alwaysOmitted:f.c c',
    ]);
  });

  it('reads JSX attributes and children for a component, and nothing behind a spread attribute', () => {
    expect(
      findingsIn({
        '/p/lib.d.ts': [
          'declare namespace JSX { interface IntrinsicElements { div: any } interface Element {} interface ElementChildrenAttribute { children: {} } }',
          'type HtmlAttributes = { className?: string };',
        ].join('\n'),
        '/p/Box.tsx': [
          'export const Box = ({ title = "", size = 1, flag, children, className }: { title?: string; size?: number; flag?: boolean; children?: unknown } & HtmlAttributes) => <div>{title}{size}{String(flag)}{String(children)}{className}</div>;',
          'export const Spread = ({ x }: { x?: number }) => <div>{x}</div>;',
        ].join('\n'),
        '/p/a.tsx': [
          "import { Box, Spread } from './Box';",
          'const props = { x: 1 };',
          'export const A = () => <><Box title={String(1)} flag /><Box title="b" flag={true}>text</Box><Box title={String(2)} flag></Box><Spread {...props} /><Spread /></>;',
        ].join('\n'),
      }),
    ).toEqual([
      '/p/Box.tsx:defaultNeverUsed:Box.title ""',
      '/p/Box.tsx:alwaysOmitted:Box.size size = 1',
      '/p/Box.tsx:alwaysSame:Box.flag flag',
    ]);
  });
  it('skips `this`, array patterns and rest elements, counts `export default` as no hand-on, and `.bind` as one', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'function withThis(this: unknown, n: number) { return n; } withThis.call(null, 1); withThis(1);',
          'const pattern = ([x]: number[], { a, ...rest }: { a: number; b: number }) => x + a + rest.b; pattern([1], { a: 1, b: 2 }); pattern([1], { a: 1, b: 3 });',
          'const exported = (n: number) => n; exported(1); export default exported;',
        ].join('\n'),
      }),
    ).toEqual([
      '/p/f.ts:alwaysSame:pattern.a a',
      '/p/f.ts:alwaysSame:exported.n n: number',
    ]);
  });

  it('reads the arguments of a function with a `this` parameter from the first one on, since no argument fills `this`', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'function positional(this: void, n: number, m: number) { return n + m; } positional(1, 5); positional(2, 5);',
          'function destructured(this: void, { x }: { x: number }, y: number) { return x + y; } destructured({ x: 1 }, 2); destructured({ x: 1 }, 3);',
        ].join('\n'),
      }),
    ).toEqual([
      '/p/f.ts:alwaysSame:positional.m m: number',
      '/p/f.ts:alwaysSame:destructured.x x',
    ]);
  });

  it('keeps a default an argument whose type admits undefined may leave to apply', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'const maybe = (): number | undefined => 1;',
          'const sure = (): number => 1;',
          'const kept = (n: number, d = 3) => n + d; kept(1, maybe()); kept(2, 4);',
          'const unused = (n: number, d = 3) => n + d; unused(1, sure()); unused(2, 4);',
          'const prop = ({ d = 3 }: { d?: number }) => d; const o: { d?: number } = {}; prop({ d: o.d }); prop({ d: 4 });',
        ].join('\n'),
      }),
    ).toEqual(['/p/f.ts:defaultNeverUsed:unused.d 3']);
  });

  it('reads nothing from an object argument with a computed key, which may name any property', () => {
    expect(
      findingsIn({
        '/p/f.ts':
          "const f = ({ a }: { a?: number }) => a; const k = 'a'; f({ [k]: 1 }); f({ [k]: 2 });",
      }),
    ).toEqual([]);
  });

  it('reads calls of an overloaded function, a named default export and an optional call, and skips a function called with `new`', () => {
    expect(
      findingsIn({
        '/p/o.ts':
          'function o(n: number): number; function o(n: string): string; function o(n: unknown) { return n; } o(1); o(1);',
        '/p/d.ts':
          'export default function d(n: number) { return n; } d(1); d(1);',
        '/p/q.ts': 'const q = (n: number) => n; q?.(1); q?.(1);',
        '/p/n.ts': 'function N(n: number) { return n; } new N(1); N(1);',
      }),
    ).toEqual([
      '/p/o.ts:alwaysSame:o.n n: unknown',
      '/p/d.ts:alwaysSame:d.n n: number',
      '/p/q.ts:alwaysSame:q.n n: number',
    ]);
  });
});
