// @vitest-environment node

// @ts-check
import ts from 'typescript';
import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule, { findConstantArguments } from '../no-constant-argument.js';
import { createProgramFor, lintInMemory } from './support/lintInMemory.js';

/**
 * Analyses an in-memory project: `files` maps absolute posix paths to source text; a relative specifier resolves through the compiler's own bundler resolution, and no default library is loaded, so a declaration file gives `String` the one signature the cases call, typing what it returns as a `string` that cannot be `undefined`.
 * @param {Record<string, string>} projectFiles
 * @returns {{ files: Record<string, string>, findings: ReturnType<typeof findConstantArguments> }}
 */
const analyse = (projectFiles) => {
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
  return { files, findings: findConstantArguments(program) };
};

/**
 * @param {Record<string, string>} projectFiles
 * @returns {string[]} each finding as `<file>:<messageId>:<function>.<name>` followed by the reported text
 */
const findingsIn = (projectFiles) => {
  const { files, findings } = analyse(projectFiles);
  return [...findings].flatMap(([fileName, fileFindings]) =>
    fileFindings.map(
      ({ start, end, messageId, data }) =>
        `${fileName}:${messageId}:${data.function}.${data.name} ${files[fileName].slice(start, end)}`,
    ),
  );
};

/**
 * @param {Record<string, string>} projectFiles
 * @returns {{ messageId: string, data: Record<string, string> }[]} the findings of every file, with their message data
 */
const dataIn = (projectFiles) =>
  [...analyse(projectFiles).findings.values()]
    .flat()
    .map(({ messageId, data }) => ({ messageId, data }));

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

describe('findConstantArguments, what fills a slot', () => {
  it('stops at a rest parameter, and reads string-keyed properties of an object pattern but not computed ones or a rest element', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'const withRest = (first: number, ...rest: number[]) => first + rest.length; withRest(1, 2); withRest(3, 2);',
          "const keyed = ({ 'quoted-key': q, ...others }: { 'quoted-key': number; other: number }) => q + others.other; keyed({ 'quoted-key': 1, other: 2 }); keyed({ 'quoted-key': 1, other: 3 });",
        ].join('\n'),
      }),
    ).toEqual(["/p/f.ts:alwaysSame:keyed.quoted-key 'quoted-key': q"]);
  });

  it('skips a declaration without a body or an initializer', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'declare function ambient(n: number): number; ambient(1); ambient(1);',
          'declare const callback: (n: number) => number; callback(1); callback(1);',
        ].join('\n'),
      }),
    ).toEqual([]);
  });

  it('counts a value as fixed only for a module-level const, not for let, var, a local const or an unresolved name', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'let mutable = 1; var legacy = 1; const fixed = 1; declare const bare: number;',
          'const byLet = (n: number) => n; byLet(mutable); byLet(mutable);',
          'const byVar = (n: number) => n; byVar(legacy); byVar(legacy);',
          'const byFixed = (n: number) => n; byFixed(fixed); byFixed(fixed);',
          'const byBare = (n: number) => n; byBare(bare); byBare(bare);',
          'declare const missing: never; const byMissing = (n: number) => n; byMissing(unresolved); byMissing(unresolved);',
        ].join('\n'),
      }),
    ).toEqual(['/p/f.ts:alwaysSame:byFixed.n n: number']);
  });

  it('reads every literal form as a constant when a module const holds it, and a computed form as none', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'const flag = true;',
          'const off = false;',
          'const nothing = null;',
          'const text = "a" + "b";',
          'const template = `t`;',
          'const negative = -1;',
          'const sum = 1 + 2;',
          'const list = [1, "a"];',
          'const record = { a: 1, b: flag };',
          'const shorthand = { flag };',
          'const viaConst = negative;',
          'declare const input: number;',
          'const positive = +1;',
          'const negatedText = -"a";',
          'const leftComputed = input + 1;',
          'const rightComputed = 1 + input;',
          'const spreadList = [...list];',
          'const computedList = [input];',
          'const computedRecord = { a: input };',
          'const methodRecord = { run() { return 1; } };',
          'const spreadRecord = { ...record };',
          'const use = (v: unknown) => v;',
          'use(flag); use(flag);',
          'const useOff = (v: unknown) => v; useOff(off); useOff(off);',
          'const useNothing = (v: unknown) => v; useNothing(nothing); useNothing(nothing);',
          'const useText = (v: unknown) => v; useText(text); useText(text);',
          'const useTemplate = (v: unknown) => v; useTemplate(template); useTemplate(template);',
          'const useNegative = (v: unknown) => v; useNegative(negative); useNegative(negative);',
          'const useSum = (v: unknown) => v; useSum(sum); useSum(sum);',
          'const useList = (v: unknown) => v; useList(list); useList(list);',
          'const useRecord = (v: unknown) => v; useRecord(record); useRecord(record);',
          'const useShorthand = (v: unknown) => v; useShorthand(shorthand); useShorthand(shorthand);',
          'const useVia = (v: unknown) => v; useVia(viaConst); useVia(viaConst);',
          'const usePositive = (v: unknown = 0) => v; usePositive(positive); usePositive(positive);',
          'const useNegatedText = (v: unknown = 0) => v; useNegatedText(negatedText); useNegatedText(negatedText);',
          'const useLeft = (v: unknown = 0) => v; useLeft(leftComputed); useLeft(leftComputed);',
          'const useRight = (v: unknown = 0) => v; useRight(rightComputed); useRight(rightComputed);',
          'const useSpreadList = (v: unknown = 0) => v; useSpreadList(spreadList); useSpreadList(spreadList);',
          'const useComputedList = (v: unknown = 0) => v; useComputedList(computedList); useComputedList(computedList);',
          'const useComputedRecord = (v: unknown = 0) => v; useComputedRecord(computedRecord); useComputedRecord(computedRecord);',
          'const useMethodRecord = (v: unknown = 0) => v; useMethodRecord(methodRecord); useMethodRecord(methodRecord);',
          'const useSpreadRecord = (v: unknown = 0) => v; useSpreadRecord(spreadRecord); useSpreadRecord(spreadRecord);',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual([
      '/p/f.ts:alwaysSame:use.v',
      '/p/f.ts:alwaysSame:useOff.v',
      '/p/f.ts:alwaysSame:useNothing.v',
      '/p/f.ts:alwaysSame:useText.v',
      '/p/f.ts:alwaysSame:useTemplate.v',
      '/p/f.ts:alwaysSame:useNegative.v',
      '/p/f.ts:alwaysSame:useSum.v',
      '/p/f.ts:alwaysSame:useList.v',
      '/p/f.ts:alwaysSame:useRecord.v',
      '/p/f.ts:alwaysSame:useShorthand.v',
      '/p/f.ts:alwaysSame:useVia.v',
      '/p/f.ts:defaultNeverUsed:usePositive.v',
      '/p/f.ts:defaultNeverUsed:useNegatedText.v',
      '/p/f.ts:defaultNeverUsed:useLeft.v',
      '/p/f.ts:defaultNeverUsed:useRight.v',
      '/p/f.ts:defaultNeverUsed:useSpreadList.v',
      '/p/f.ts:defaultNeverUsed:useComputedList.v',
      '/p/f.ts:defaultNeverUsed:useComputedRecord.v',
      '/p/f.ts:defaultNeverUsed:useMethodRecord.v',
      '/p/f.ts:defaultNeverUsed:useSpreadRecord.v',
    ]);
  });
});

describe('findConstantArguments, what a call site gives', () => {
  it('tells apart the keys of strings, numbers, signs, keywords and distinct constants', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'const K1 = 1; const K2 = 1;',
          "const stringNumber = (v: unknown) => v; stringNumber('number:1'); stringNumber(1);",
          'const sign = (v: unknown) => v; sign(-1); sign(1);',
          'const keywords = (v: unknown) => v; keywords(true); keywords(false);',
          'const nullKeyword = (v: unknown) => v; nullKeyword(null); nullKeyword(false);',
          'const distinct = (v: unknown) => v; distinct(K1); distinct(K2);',
          'const same = (v: unknown) => v; same(K1); same(K1);',
          'const template = (v: unknown) => v; template(`a`); template("a");',
          'const negativeZero = (v: unknown) => v; negativeZero(-0); negativeZero(0);',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual([
      '/p/f.ts:alwaysSame:same.v',
      '/p/f.ts:alwaysSame:template.v',
      '/p/f.ts:alwaysSame:negativeZero.v',
    ]);
  });

  it('shows the value of a finding in full up to 40 characters and cut after them', () => {
    const forty = 'a'.repeat(38);
    const data = dataIn({
      '/p/f.ts': [
        `const exact = (v: string) => v; exact('${forty}'); exact('${forty}');`,
        `const over = (v: string) => v; over('${forty}b'); over('${forty}b');`,
      ].join('\n'),
    });

    expect(data.map(({ data: fields }) => fields.value)).toEqual([
      `'${forty}'`,
      `'${forty}b'`.slice(0, 40) + '…',
    ]);
  });

  it('words the fallback of an always-omitted parameter as its default, or undefined without one', () => {
    expect(
      dataIn({
        '/p/f.ts': [
          'const withDefault = (a: number, b = 7) => a + b; withDefault(String(1).length); withDefault(String(2).length);',
          'const without = (a: number, b?: number) => a + (b ?? 0); without(String(1).length); without(String(2).length);',
        ].join('\n'),
      }).map(({ messageId, data }) => [messageId, data.name, data.fallback]),
    ).toEqual([
      ['alwaysOmitted', 'b', 'its default 7'],
      ['alwaysOmitted', 'b', 'undefined'],
    ]);
  });

  it('treats an argument whose type is any, unknown, undefined or void as one that may leave a default to apply', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'declare const a: any; declare const u: unknown; declare const v: void; declare const n: undefined; declare const s: string;',
          'const viaAny = (x: unknown = 1) => x; viaAny(a); viaAny(a);',
          'const viaUnknown = (x: unknown = 1) => x; viaUnknown(u); viaUnknown(u);',
          'const viaVoid = (x: unknown = 1) => x; viaVoid(v); viaVoid(v);',
          'const viaUndefined = (x: unknown = 1) => x; viaUndefined(n); viaUndefined(n);',
          'const viaString = (x: unknown = 1) => x; viaString(s); viaString(s);',
        ].join('\n'),
      }),
    ).toEqual(['/p/f.ts:defaultNeverUsed:viaString.x 1']);
  });

  it('reads arguments behind a spread as unknown from the first spread on, and those before it as written', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'declare const rest: number[];',
          'const f = (a: number, b: number) => a + b; f(1, ...rest); f(1, ...rest);',
          'const g = (a: number, b: number) => a + b; g(...rest, 1); g(...rest, 1);',
        ].join('\n'),
      }),
    ).toEqual(['/p/f.ts:alwaysSame:f.a a: number']);
  });

  it('reads an object argument by property name, through shorthand and string keys, and a method as a computed value', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'const key = 1;',
          'const shorthand = ({ key: k }: { key: number }) => k; shorthand({ key }); shorthand({ key });',
          'const method = ({ run }: { run: () => number }) => run(); method({ run() { return 1; } }); method({ run() { return 1; } });',
          'const spreading = ({ a }: { a: number }) => a; spreading({ ...{ a: 1 } }); spreading({ a: 1 });',
          'const absent = ({ a, b = 1 }: { a: number; b?: number }) => a + b; absent({ a: 1 }); absent({ a: 2 });',
          "const notObject = ({ a }: { a: number }) => a; notObject({ a: 1 } as { a: number }); notObject(JSON.parse('{}'));",
        ].join('\n'),
      }),
    ).toEqual([
      '/p/f.ts:alwaysSame:shorthand.key key: k',
      '/p/f.ts:alwaysOmitted:absent.b b = 1',
    ]);
  });
});

describe('findConstantArguments, which references count', () => {
  it('reads a property access callee, and treats a hand-on by argument, assignment or attribute as an escape', () => {
    expect(
      findingsIn({
        '/p/m.ts':
          'export const f = (n: number) => n; export const g = (n: number) => n; export const h = (n: number) => n;',
        '/p/a.ts': [
          "import * as m from './m'; import { g, h } from './m';",
          'm.f(1); m.f(1);',
          'g(1); g(1); [1].forEach(g);',
          'const alias = h; h(1); h(1);',
        ].join('\n'),
      }),
    ).toEqual(['/p/m.ts:alwaysSame:f.n n: number']);
  });

  it('counts an import or export specifier, a closing tag, a typeof query and a qualified name as no hand-on', () => {
    expect(
      findingsIn({
        '/p/lib.d.ts':
          'declare namespace JSX { interface IntrinsicElements { div: any } interface Element {} interface ElementChildrenAttribute { children: {} } }',
        '/p/m.tsx': [
          'export const Comp = ({ label }: { label: string }) => <div>{label}</div>;',
          'export const f = (n: number) => n;',
          'export type Shape = typeof f;',
        ].join('\n'),
        '/p/a.tsx': [
          "import { Comp, f } from './m'; export { Comp as Renamed };",
          'f(1); f(1);',
          'export const view = () => <><Comp label="x"></Comp><Comp label="x" /></>;',
        ].join('\n'),
      }),
    ).toEqual([
      '/p/m.tsx:alwaysSame:Comp.label label',
      '/p/m.tsx:alwaysSame:f.n n: number',
    ]);
  });

  it('counts a function handed on as a JSX attribute value as an escape', () => {
    expect(
      findingsIn({
        '/p/lib.d.ts':
          'declare namespace JSX { interface IntrinsicElements { div: any } interface Element {} }',
        '/p/m.tsx': [
          'export const f = (n: number) => n; f(1); f(1);',
          'export const view = () => <div render={f} />;',
        ].join('\n'),
      }),
    ).toEqual([]);
  });

  it('analyses neither a declaration file nor a file under node_modules, and counts no call of a test file', () => {
    expect(
      findingsIn({
        '/p/types.d.ts': 'export declare const f: (n: number) => number;',
        '/p/node_modules/pkg/index.ts':
          'export const f = (n: number) => n; f(1); f(1);',
        '/p/a.ts': 'export const g = (n: number) => n; g(1); g(1);',
      }),
    ).toEqual(['/p/a.ts:alwaysSame:g.n n: number']);
  });

  it('counts a function only a declaration file calls, and a library-declared property, as no finding', () => {
    expect(
      findingsIn({
        '/p/lib.d.ts':
          'interface BaseProps { className?: string; id?: string }',
        '/p/f.ts': [
          'const own = ({ className, id, label }: BaseProps & { label?: string }) => [className, id, label];',
          'own({ id: "a" }); own({ id: "a" });',
          'interface Both { id?: string }',
          'const mixed = ({ id }: BaseProps & Both) => id; mixed({}); mixed({});',
        ].join('\n'),
      }),
    ).toEqual([
      '/p/f.ts:alwaysOmitted:own.label label',
      '/p/f.ts:alwaysOmitted:mixed.id id',
    ]);
  });
});

describe('findConstantArguments, JSX call sites', () => {
  const lib =
    'declare namespace JSX { interface IntrinsicElements { div: any } interface Element {} interface ElementChildrenAttribute { children: {} } }';

  it('reads the props of a component from its attributes only for a destructured first parameter', () => {
    expect(
      findingsIn({
        '/p/lib.d.ts': lib,
        '/p/m.tsx': [
          'export const Positional = (props: { a?: number }) => <div>{props.a}</div>;',
          'export const Second = (n: number, { a }: { a?: number; children?: unknown }) => <div>{n}{a}</div>;',
          'export const Flag = ({ on }: { on?: boolean }) => <div>{String(on)}</div>;',
          'export const Element = ({ icon }: { icon?: unknown }) => <div>{String(icon)}</div>;',
        ].join('\n'),
        '/p/a.tsx': [
          "import { Element, Flag, Positional, Second } from './m';",
          'export const view = () => <><Positional a={1} /><Positional a={1} /><Second a={1} /><Second a={1} /><Flag on /><Flag on={true} /><Element icon=<div /> /><Element icon=<div /> /></>;',
        ].join('\n'),
      }),
    ).toEqual(['/p/m.tsx:alwaysSame:Flag.on on']);
  });

  it('reads an attribute without a value as true, an empty expression as omitted and an element value as computed', () => {
    expect(
      dataIn({
        '/p/lib.d.ts': lib,
        '/p/m.tsx': [
          'export const Flag = ({ on, gone = 1, node = 2 }: { on?: boolean; gone?: number; node?: unknown }) => <div>{String(on)}{gone}{String(node)}</div>;',
        ].join('\n'),
        '/p/a.tsx': [
          "import { Flag } from './m';",
          'export const view = () => <><Flag on gone={/* none */} node=<div /> /><Flag on={true} gone={/* none */} node=<div /> /></>;',
        ].join('\n'),
      }).map(({ messageId, data }) => [
        messageId,
        data.name,
        data.value ?? data.fallback,
      ]),
    ).toEqual([
      ['alwaysSame', 'on', 'true'],
      ['alwaysOmitted', 'gone', 'its default 1'],
      ['defaultNeverUsed', 'node', '2'],
    ]);
  });

  it('reads the children of a component, and no children for whitespace between its tags', () => {
    const box =
      'export const Box = ({ children = "none" }: { children?: string }) => <div>{children}</div>;';
    const withText = [
      "import { Box } from './m';",
      'export const view = () => <><Box>text</Box><Box>other</Box></>;',
    ].join('\n');

    expect(
      findingsIn({ '/p/lib.d.ts': lib, '/p/m.tsx': box, '/p/a.tsx': withText }),
    ).toEqual(['/p/m.tsx:defaultNeverUsed:Box.children "none"']);
    expect(
      findingsIn({
        '/p/lib.d.ts': lib,
        '/p/m.tsx': box,
        '/p/a.tsx': withText,
        '/p/b.tsx': [
          "import { Box } from './m';",
          'export const empty = () => <Box>',
          '</Box>;',
        ].join('\n'),
      }),
    ).toEqual([]);
  });
});

describe('findConstantArguments, the remaining branches', () => {
  it('reads a property of an object literal as fixed only when a module-level const holds the literal', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'let mutable = { a: 1 }; const fixed = { a: 1 };',
          'const byLet = (n: number) => n; byLet(mutable.a); byLet(mutable.a);',
          'const byConst = (n: number) => n; byConst(fixed.a); byConst(fixed.a);',
          'const alias = unresolvedName; const byAlias = (n: unknown = 0) => n; byAlias(alias); byAlias(alias);',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual(['/p/f.ts:alwaysSame:byConst.n']);
  });

  it('reads an array or object constant as fixed only when every element is', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'declare const input: number;',
          'const mixedList = [1, input]; const mixedRecord = { a: 1, b: input };',
          'const useList = (v: unknown = 0) => v; useList(mixedList); useList(mixedList);',
          'const useRecord = (v: unknown = 0) => v; useRecord(mixedRecord); useRecord(mixedRecord);',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual([
      '/p/f.ts:defaultNeverUsed:useList.v',
      '/p/f.ts:defaultNeverUsed:useRecord.v',
    ]);
  });

  it('tells apart two different strings, and reads a unary plus, minus and keyword constants as the kinds they are', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          "const strings = (v: unknown) => v; strings('a'); strings('b');",
          'const plus = (v: unknown) => v; plus(+1); plus(-1);',
          'const tilde = (v: unknown) => v; tilde(~1); tilde(-1);',
          'const falses = (v: unknown) => v; falses(false); falses(false);',
          'const nulls = (v: unknown) => v; nulls(null); nulls(null);',
          'const negatives = (v: unknown) => v; negatives(-1); negatives(-1);',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual([
      '/p/f.ts:alwaysSame:falses.v',
      '/p/f.ts:alwaysSame:nulls.v',
      '/p/f.ts:alwaysSame:negatives.v',
    ]);
  });

  it('gives one constant one identity across call sites, however the other constants are interleaved', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'const K1 = 1; const K2 = 2;',
          'const a = (v: number) => v; const b = (v: number) => v;',
          'a(K1); b(K2); a(K1); b(K2);',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual(['/p/f.ts:alwaysSame:a.v', '/p/f.ts:alwaysSame:b.v']);
  });

  it('skips a slot named by a computed key', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          "const key = 'a';",
          'const computed = ({ [key]: v }: Record<string, number>) => v; computed({ a: 1 }); computed({ a: 2 });',
        ].join('\n'),
      }),
    ).toEqual([]);
  });

  it('reads the first spread position as unknown, and a method of an object argument as a computed value', () => {
    expect(
      findingsIn({
        '/p/f.ts': [
          'declare const rest: number[];',
          'const g = (a = 1, b?: number) => [a, b]; g(...rest); g(...rest);',
          'const method = ({ run = () => 0 }: { run?: () => number }) => run(); method({ run() { return 1; } }); method({ run() { return 2; } });',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual(['/p/f.ts:defaultNeverUsed:method.run']);
  });

  it('reads children made of an element between whitespace as children', () => {
    const lib =
      'declare namespace JSX { interface IntrinsicElements { div: any } interface Element {} interface ElementChildrenAttribute { children: {} } }';

    expect(
      findingsIn({
        '/p/lib.d.ts': lib,
        '/p/m.tsx':
          'export const Box = ({ children = "none" }: { children?: unknown }) => <div>{String(children)}</div>;',
        '/p/a.tsx': [
          "import { Box } from './m';",
          'export const view = () => <Box>',
          '  <div />',
          '</Box>;',
        ].join('\n'),
      }),
    ).toEqual(['/p/m.tsx:defaultNeverUsed:Box.children "none"']);
  });

  it('skips a destructured property only a declaration file declares, and not a positional parameter named like one', () => {
    expect(
      findingsIn({
        '/p/lib.d.ts':
          'interface Sized { size: number } declare const sized: Sized;',
        '/p/f.ts': [
          'const positional = (size: Sized = sized) => size; positional(sized); positional(sized);',
          'const missing = ({ absent }: { other?: number }) => absent; missing({}); missing({});',
          'const mapped = ({ a }: Record<"a", number>) => a; mapped({ a: 1 }); mapped({ a: 1 });',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual([
      '/p/f.ts:defaultNeverUsed:positional.size',
      '/p/f.ts:alwaysOmitted:missing.absent',
      '/p/f.ts:alwaysSame:mapped.a',
    ]);
  });

  it('counts a call through call or apply, a handed-on callback and a qualified type name as the references they are', () => {
    expect(
      findingsIn({
        '/p/m.ts': 'export const f = (n: number) => n;',
        '/p/f.ts': [
          "import * as m from './m';",
          'export type Shape = typeof m.f;',
          'm.f(1); m.f(1);',
          'const viaCall = (n: number) => n; viaCall.call(null, 1); viaCall.call(null, 1);',
          'const handed = (n = 5) => n; handed(1); handed(2); [1].forEach(handed);',
          'const viaLeft = (n: number) => n; viaLeft(1); viaLeft(1); export type Extra = typeof viaLeft.extra;',
          'const shadowed = (n: number) => n; shadowed(1); shadowed(1);',
          'const run = (shadowed: (n: number) => number) => shadowed(2); run(shadowed);',
        ].join('\n'),
      }).map((finding) => finding.split(' ')[0]),
    ).toEqual(['/p/m.ts:alwaysSame:f.n']);
  });
});

describe('rule', () => {
  /** @param {Record<string, string>} files @param {string} filename */
  const lint = (files, filename) =>
    lintInMemory({ rule, files, filename }).map(({ line, column, message }) => [
      line,
      column,
      message,
    ]);

  it('words each kind of finding, at the parameter, the default or the property', () => {
    const files = {
      '/p/f.ts': [
        'export const same = (min: number) => min;',
        'export const omitted = (a: number, max = 9) => a + max;',
        'export const unused = (a: number, d = 3) => a + d;',
        'same(1); same(1); omitted(String(1).length); omitted(String(2).length); unused(1, Number("4")); unused(2, Number("5"));',
      ].join('\n'),
    };

    expect(lint(files, '/p/f.ts')).toEqual([
      [
        1,
        22,
        "Every production call of 'same' passes 1 for 'min'. Remove the parameter and use that value inside.",
      ],
      [
        2,
        36,
        "Every production call of 'omitted' omits 'max', so it always holds its default 9. Remove it.",
      ],
      [
        3,
        39,
        "Every production call of 'unused' passes 'd', so its default 3 never applies. Remove the default.",
      ],
    ]);
  });

  it('reports nothing for a test file, and counts no call of one', () => {
    const files = {
      '/p/f.ts': 'export const f = (n: number) => n; f(1); f(2);',
      '/p/__tests__/f.test.ts':
        "import { f } from '../f'; f(3); export const own = (n: number) => n; own(1); own(1);",
    };

    expect(lint(files, '/p/__tests__/f.test.ts')).toEqual([]);
    expect(lint(files, '/p/f.ts')).toEqual([]);
  });

  it('analyses the program once for all the files it lints', () => {
    const files = {
      '/p/a.ts': 'export const a = (n: number) => n; a(1); a(1);',
      '/p/b.ts': 'export const b = (n: number) => n; b(1); b(1);',
    };
    const program = createProgramFor(files);
    const checker = program.getTypeChecker();
    let checkerRequests = 0;
    program.getTypeChecker = () => {
      checkerRequests += 1;
      return checker;
    };

    lintInMemory({ rule, files, filename: '/p/a.ts', program });
    const requestsOfFirst = checkerRequests;
    const second = lintInMemory({ rule, files, filename: '/p/b.ts', program });
    const requestsOfSecond = checkerRequests - requestsOfFirst;

    // The first lint asks for the checker to analyse the program; the second reuses that analysis.
    expect(requestsOfSecond).toBeLessThan(requestsOfFirst);
    expect(second).toHaveLength(1);
  });

  it('returns no visitors without a program, and accepts no option', () => {
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: undefined },
          filename: '/p/a.ts',
        }),
      ),
    ).toEqual({});
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: {} },
          filename: '/p/a.ts',
        }),
      ),
    ).toEqual({});
    expect(() =>
      new Linter().verify('', [
        {
          plugins: { local: { rules: { 'no-constant-argument': rule } } },
          rules: { 'local/no-constant-argument': ['error', {}] },
        },
      ]),
    ).toThrow(
      new Error(
        'Key "rules": Key "local/no-constant-argument":\n\tValue [{}] should NOT have more than 0 items.\n',
      ),
    );
  });
});
