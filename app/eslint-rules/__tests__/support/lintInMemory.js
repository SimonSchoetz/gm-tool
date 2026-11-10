// @ts-check
import { Linter } from 'eslint';
import ts from 'typescript';
import tseslint from 'typescript-eslint';

/**
 * The TypeScript program of an in-memory project: the given files plus the compiler's own libraries, read from disk.
 * @param {Record<string, string>} files absolute posix path to source text
 * @returns {import('typescript').Program}
 */
export const createProgramFor = (files) => {
  /** @type {import('typescript').CompilerOptions} */
  const compilerOptions = {
    strict: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    lib: ['lib.esnext.d.ts'],
  };
  const host = ts.createCompilerHost(compilerOptions);
  const { fileExists, readFile, getSourceFile } = host;
  host.fileExists = (fileName) => fileName in files || fileExists(fileName);
  host.readFile = (fileName) => files[fileName] ?? readFile(fileName);
  host.directoryExists = (directory) =>
    Object.keys(files).some((fileName) =>
      fileName.startsWith(`${directory}/`),
    ) || ts.sys.directoryExists(directory);
  host.getSourceFile = (fileName, languageVersion, onError) =>
    fileName in files
      ? ts.createSourceFile(fileName, files[fileName], languageVersion, true)
      : getSourceFile(fileName, languageVersion, onError);
  return ts.createProgram(Object.keys(files), compilerOptions, host);
};

/**
 * Lints one file of an in-memory TypeScript project with one rule, through the real ESLint `Linter` and the typed parser, so the rule's `meta`, option schema and `create` run as they do in a lint run.
 * @param {{ rule: import('eslint').Rule.RuleModule, files: Record<string, string>, filename: string, options?: unknown[], program?: import('typescript').Program }} args `files` maps absolute posix paths to source text, `filename` is the one of them to lint, and a `program` of `createProgramFor` lets several lints share one program, as the files of one lint run do
 * @returns {import('eslint').Linter.LintMessage[]} the file's messages: the rule's reports, and a parse error as a fatal message
 */
export const lintInMemory = ({
  rule,
  files,
  filename,
  options = [],
  program = createProgramFor(files),
}) => {
  return new Linter({ cwd: '/' }).verify(
    files[filename],
    [
      {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { programs: [program] },
        },
        plugins: { local: { rules: { 'rule-under-test': rule } } },
        rules: { 'local/rule-under-test': ['error', ...options] },
      },
    ],
    { filename },
  );
};
