// @ts-check
import ts from 'typescript';
import { isTestFile, toPosix } from './no-unused-exports.js';

/**
 * What one call site gives one parameter: nothing (`omitted`, also an explicit `undefined`), a value (`key` names a constant, so two equal keys are the same value, and is `null` for a value computed at run time), or something no reading of the call site can tell (`unknown`: behind a spread or a computed property key, or a value whose type admits `undefined`, which may leave a default to apply).
 * @typedef {{ state: 'omitted' } | { state: 'passed', key: string | null, text: string } | { state: 'unknown' }} ArgumentValue
 */

/**
 * A parameter, or one property of a destructured parameter, that call sites fill: by position, or by property name inside the argument at `index` (a JSX attribute for a component's props). `index` counts call arguments, so a `this` parameter, which no argument fills, shifts it; `parameter` is the declaring parameter.
 * @typedef {{ kind: 'positional' | 'property', index: number, parameter: import('typescript').ParameterDeclaration, name: string, node: import('typescript').Node, initializer: import('typescript').Expression | undefined }} Slot
 */

/**
 * A call site of a candidate function: a call expression, or a JSX element whose tag names a component.
 * @typedef {{ kind: 'call', node: import('typescript').CallExpression } | { kind: 'jsx', node: import('typescript').JsxOpeningLikeElement }} CallSite
 */

/**
 * @typedef {{ name: string, slots: Slot[], sites: CallSite[], escaped: boolean }} Candidate
 */

/**
 * A finding of one file, in that file's text offsets.
 * @typedef {{ start: number, end: number, messageId: 'alwaysOmitted' | 'alwaysSame' | 'defaultNeverUsed', data: Record<string, string> }} Finding
 */

const MAX_VALUE_TEXT_LENGTH = 40;

/** @param {import('typescript').Expression} expression */
const unwrapExpression = (expression) => {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
};

/**
 * @param {import('typescript').SignatureDeclaration} declaration
 * @returns {Slot[]} the parameters call sites fill, up to a rest parameter; an array pattern is left out
 */
const slotsOf = (declaration) => {
  /** @type {Slot[]} */
  const slots = [];
  const argumentParameters = declaration.parameters.filter(
    ({ name }) => !ts.isIdentifier(name) || name.text !== 'this',
  );
  for (const [index, parameter] of argumentParameters.entries()) {
    if (parameter.dotDotDotToken) {
      break;
    }
    const { name } = parameter;
    if (ts.isIdentifier(name)) {
      slots.push({
        kind: 'positional',
        index,
        parameter,
        name: name.text,
        node: parameter,
        initializer: parameter.initializer,
      });
    } else if (ts.isObjectBindingPattern(name)) {
      for (const element of name.elements) {
        const key = element.propertyName ?? element.name;
        if (
          !element.dotDotDotToken &&
          (ts.isIdentifier(key) || ts.isStringLiteral(key))
        ) {
          slots.push({
            kind: 'property',
            index,
            parameter,
            name: key.text,
            node: element,
            initializer: element.initializer,
          });
        }
      }
    }
  }
  return slots;
};

/**
 * @param {import('typescript').Node} node
 * @returns {import('typescript').SignatureDeclaration | null} the function a declaration names: a function declaration, or a variable initialised with an arrow function or function expression
 */
const functionDeclaredBy = (node) => {
  if (ts.isFunctionDeclaration(node) && node.name && node.body) {
    return node;
  }
  if (ts.isVariableDeclaration(node) && node.initializer) {
    const initializer = unwrapExpression(node.initializer);
    if (
      ts.isArrowFunction(initializer) ||
      ts.isFunctionExpression(initializer)
    ) {
      return initializer;
    }
  }
  return null;
};

/**
 * @param {import('typescript').TypeChecker} checker
 * @param {import('typescript').Node} node
 * @returns {import('typescript').Symbol | undefined} the symbol a name refers to, through imports, re-exports and shorthand properties, as its export symbol when it has one
 */
const referencedSymbolOf = (checker, node) => {
  let symbol =
    node.parent && ts.isShorthandPropertyAssignment(node.parent)
      ? checker.getShorthandAssignmentValueSymbol(node.parent)
      : checker.getSymbolAtLocation(node);
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  return symbol ? checker.getExportSymbolOfSymbol(symbol) : undefined;
};

/** @param {import('typescript').Node} node */
const isModuleLevelConstDeclaration = (node) =>
  ts.isVariableDeclaration(node) &&
  ts.isVariableDeclarationList(node.parent) &&
  (node.parent.flags & ts.NodeFlags.Const) !== 0 &&
  ts.isVariableStatement(node.parent.parent) &&
  ts.isSourceFile(node.parent.parent.parent);

/**
 * @param {import('typescript').Expression} expression
 * @returns {boolean} whether the expression is a literal: a string, a template without substitutions, a number (negated or not), `true`, `false` or `null`
 */
const isLiteral = (expression) =>
  ts.isStringLiteral(expression) ||
  ts.isNoSubstitutionTemplateLiteral(expression) ||
  ts.isNumericLiteral(expression) ||
  (ts.isPrefixUnaryExpression(expression) &&
    expression.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(expression.operand)) ||
  expression.kind === ts.SyntaxKind.TrueKeyword ||
  expression.kind === ts.SyntaxKind.FalseKeyword ||
  expression.kind === ts.SyntaxKind.NullKeyword;

/**
 * @param {import('typescript').TypeChecker} checker
 * @param {import('typescript').Expression} written
 * @param {Set<import('typescript').Symbol>} visited constants already being checked, so a self-referencing initializer ends
 * @returns {boolean} whether the source text fixes the expression's value: a literal, an arithmetic or string combination of such values, an array or object literal of them, or a reference to a constant (`isSourceConstant`)
 */
const isConstantExpression = (checker, written, visited) => {
  const expression = unwrapExpression(written);
  if (isLiteral(expression)) {
    return true;
  }
  if (ts.isBinaryExpression(expression)) {
    return (
      isConstantExpression(checker, expression.left, visited) &&
      isConstantExpression(checker, expression.right, visited)
    );
  }
  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.every(
      (element) =>
        !ts.isSpreadElement(element) &&
        isConstantExpression(checker, element, visited),
    );
  }
  if (ts.isObjectLiteralExpression(expression)) {
    return expression.properties.every(
      (property) =>
        (ts.isPropertyAssignment(property) &&
          isConstantExpression(checker, property.initializer, visited)) ||
        (ts.isShorthandPropertyAssignment(property) &&
          isConstantExpression(checker, property.name, visited)),
    );
  }
  if (
    ts.isIdentifier(expression) ||
    ts.isPropertyAccessExpression(expression)
  ) {
    const symbol = referencedSymbolOf(
      checker,
      ts.isIdentifier(expression) ? expression : expression.name,
    );
    return symbol !== undefined && isSourceConstant(checker, symbol, visited);
  }
  return false;
};

/**
 * @param {import('typescript').TypeChecker} checker
 * @param {import('typescript').Symbol} symbol
 * @param {Set<import('typescript').Symbol>} [visited]
 * @returns {boolean} whether the source text fixes the symbol's value: an enum member, a module-level `const` with a constant initializer (`isConstantExpression`), or a property of an object literal such a `const` holds. A `const` computed at run time, such as a path an entry script resolves, is none: handing it to a function is how a script injects its environment.
 */
const isSourceConstant = (checker, symbol, visited = new Set()) => {
  const declaration = symbol.valueDeclaration;
  if (!declaration || visited.has(symbol)) {
    return false;
  }
  if (ts.isEnumMember(declaration)) {
    return true;
  }
  visited.add(symbol);
  if (ts.isPropertyAssignment(declaration)) {
    /** @type {import('typescript').Node} */
    let holder = declaration.parent;
    while (
      ts.isObjectLiteralExpression(holder) ||
      ts.isPropertyAssignment(holder) ||
      ts.isParenthesizedExpression(holder) ||
      ts.isAsExpression(holder) ||
      ts.isSatisfiesExpression(holder)
    ) {
      holder = holder.parent;
    }
    return (
      isModuleLevelConstDeclaration(holder) &&
      isConstantExpression(checker, declaration.initializer, visited)
    );
  }
  return (
    isModuleLevelConstDeclaration(declaration) &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined &&
    isConstantExpression(checker, declaration.initializer, visited)
  );
};

/**
 * @param {import('typescript').Type} type
 * @returns {boolean} whether a value of the type can be `undefined`: `any`, `unknown`, `undefined`, `void`, or a union with one of them as a member
 */
const mayBeUndefined = (type) =>
  (type.isUnion() ? type.types : [type]).some(
    (member) =>
      (member.flags &
        (ts.TypeFlags.Any |
          ts.TypeFlags.Unknown |
          ts.TypeFlags.Undefined |
          ts.TypeFlags.Void)) !==
      0,
  );

/**
 * @param {import('typescript').TypeChecker} checker
 * @param {(symbol: import('typescript').Symbol) => number} idOf
 * @param {import('typescript').Expression} argument
 * @returns {ArgumentValue}
 */
const valueOf = (checker, idOf, argument) => {
  const expression = unwrapExpression(argument);
  const text = expression.getText();
  const shown =
    text.length > MAX_VALUE_TEXT_LENGTH
      ? `${text.slice(0, MAX_VALUE_TEXT_LENGTH)}…`
      : text;
  if (
    (ts.isIdentifier(expression) && expression.text === 'undefined') ||
    ts.isVoidExpression(expression)
  ) {
    return { state: 'omitted' };
  }
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return { state: 'passed', key: `string:${expression.text}`, text: shown };
  }
  if (ts.isNumericLiteral(expression)) {
    return {
      state: 'passed',
      key: `number:${String(Number(expression.text))}`,
      text: shown,
    };
  }
  if (
    ts.isPrefixUnaryExpression(expression) &&
    expression.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(expression.operand)
  ) {
    return {
      state: 'passed',
      key: `number:${String(-Number(expression.operand.text))}`,
      text: shown,
    };
  }
  if (
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword ||
    expression.kind === ts.SyntaxKind.NullKeyword
  ) {
    return { state: 'passed', key: `keyword:${text}`, text: shown };
  }
  if (
    ts.isIdentifier(expression) ||
    ts.isPropertyAccessExpression(expression)
  ) {
    const symbol = referencedSymbolOf(
      checker,
      ts.isIdentifier(expression) ? expression : expression.name,
    );
    if (symbol && isSourceConstant(checker, symbol)) {
      return {
        state: 'passed',
        key: `symbol:${String(idOf(symbol))}`,
        text: shown,
      };
    }
  }
  return mayBeUndefined(checker.getTypeAtLocation(expression))
    ? { state: 'unknown' }
    : { state: 'passed', key: null, text: shown };
};

/**
 * @param {import('typescript').TypeChecker} checker
 * @param {(symbol: import('typescript').Symbol) => number} idOf
 * @param {CallSite} site
 * @param {Slot} slot
 * @returns {ArgumentValue}
 */
const argumentAt = (checker, idOf, site, slot) => {
  if (site.kind === 'jsx') {
    if (slot.kind !== 'property' || slot.index !== 0) {
      return { state: 'unknown' };
    }
    const { properties } = site.node.attributes;
    if (properties.some(ts.isJsxSpreadAttribute)) {
      return { state: 'unknown' };
    }
    const attribute = properties.find(
      (property) =>
        ts.isJsxAttribute(property) &&
        ts.isIdentifier(property.name) &&
        property.name.text === slot.name,
    );
    if (attribute && ts.isJsxAttribute(attribute)) {
      const { initializer } = attribute;
      if (!initializer) {
        return { state: 'passed', key: 'keyword:true', text: 'true' };
      }
      if (ts.isJsxExpression(initializer)) {
        return initializer.expression
          ? valueOf(checker, idOf, initializer.expression)
          : { state: 'omitted' };
      }
      return ts.isStringLiteral(initializer)
        ? valueOf(checker, idOf, initializer)
        : { state: 'passed', key: null, text: initializer.getText() };
    }
    if (
      slot.name === 'children' &&
      ts.isJsxOpeningElement(site.node) &&
      site.node.parent.children.some(
        (child) => !ts.isJsxText(child) || !child.containsOnlyTriviaWhiteSpaces,
      )
    ) {
      return { state: 'passed', key: null, text: 'children' };
    }
    return { state: 'omitted' };
  }

  const callArguments = site.node.arguments;
  const firstSpread = callArguments.findIndex(ts.isSpreadElement);
  if (firstSpread !== -1 && firstSpread <= slot.index) {
    return { state: 'unknown' };
  }
  const argument = callArguments.at(slot.index);
  if (!argument) {
    return { state: 'omitted' };
  }
  if (slot.kind === 'positional') {
    return valueOf(checker, idOf, argument);
  }
  const objectArgument = unwrapExpression(argument);
  if (
    !ts.isObjectLiteralExpression(objectArgument) ||
    objectArgument.properties.some(
      (property) =>
        ts.isSpreadAssignment(property) ||
        (property.name !== undefined &&
          ts.isComputedPropertyName(property.name)),
    )
  ) {
    return { state: 'unknown' };
  }
  const property = objectArgument.properties.find(
    (candidate) =>
      candidate.name !== undefined &&
      // TypeScript keeps a numeric literal's text in the canonical form JavaScript keys the property by: `1.0` and `0x1` both read `1`.
      (ts.isIdentifier(candidate.name) ||
        ts.isStringLiteral(candidate.name) ||
        ts.isNumericLiteral(candidate.name)) &&
      candidate.name.text === slot.name,
  );
  if (!property) {
    return { state: 'omitted' };
  }
  if (ts.isPropertyAssignment(property)) {
    return valueOf(checker, idOf, property.initializer);
  }
  if (ts.isShorthandPropertyAssignment(property)) {
    return valueOf(checker, idOf, property.name);
  }
  return { state: 'passed', key: null, text: property.getText() };
};

/**
 * @param {Slot} slot
 * @param {ArgumentValue[]} values what each call site gives the slot
 * @returns {Omit<Finding, 'start' | 'end'> & { node: import('typescript').Node } | null}
 */
const findingFor = (slot, values) => {
  if (values.length === 0 || values.some(({ state }) => state === 'unknown')) {
    return null;
  }
  if (values.every(({ state }) => state === 'omitted')) {
    return {
      node: slot.node,
      messageId: 'alwaysOmitted',
      data: {
        name: slot.name,
        fallback: slot.initializer
          ? `its default ${slot.initializer.getText()}`
          : 'undefined',
      },
    };
  }
  const passed = values.flatMap((value) =>
    value.state === 'passed' ? [value] : [],
  );
  if (passed.length !== values.length) {
    return null;
  }
  const [first] = passed;
  if (first.key !== null && passed.every(({ key }) => key === first.key)) {
    return {
      node: slot.node,
      messageId: 'alwaysSame',
      data: { name: slot.name, value: first.text },
    };
  }
  if (slot.initializer) {
    return {
      node: slot.initializer,
      messageId: 'defaultNeverUsed',
      data: { name: slot.name, value: slot.initializer.getText() },
    };
  }
  return null;
};

/**
 * @param {import('typescript').TypeChecker} checker
 * @param {Slot} slot
 * @returns {boolean} whether the slot is a destructured property only a declaration file declares, such as `className` from the HTML attributes a component forwards to its root element: it belongs to that element's API, not to the function's own
 */
const isLibraryDeclaredProperty = (checker, slot) => {
  if (slot.kind !== 'property') {
    return false;
  }
  const declarations = checker
    .getTypeAtLocation(slot.parameter)
    .getProperty(slot.name)?.declarations;
  return (
    declarations !== undefined &&
    declarations.length > 0 &&
    declarations.every((property) => property.getSourceFile().isDeclarationFile)
  );
};

/**
 * @param {import('typescript').Identifier} name a reference to a candidate function
 * @returns {CallSite | 'other' | 'neutral'} the call site the reference is the callee or JSX tag of; `neutral` for a reference that neither calls nor hands the function on (an import or export specifier, a closing JSX tag, a `typeof` type query, the name of an overload signature); `other` for any reference that hands the function on, after which call sites alone cannot tell what it receives
 */
const roleOf = (name) => {
  const { parent } = name;
  if (
    ts.isImportSpecifier(parent) ||
    ts.isImportClause(parent) ||
    ts.isExportSpecifier(parent) ||
    ts.isExportAssignment(parent) ||
    ts.isJsxClosingElement(parent) ||
    ts.isTypeQueryNode(parent) ||
    (ts.isFunctionDeclaration(parent) && parent.name === name) ||
    (ts.isQualifiedName(parent) && parent.right === name)
  ) {
    return 'neutral';
  }
  /** @type {import('typescript').Node} */
  const callee =
    ts.isPropertyAccessExpression(parent) && parent.name === name
      ? parent
      : name;
  const holder = callee.parent;
  if (ts.isCallExpression(holder) && holder.expression === callee) {
    return { kind: 'call', node: holder };
  }
  if (
    (ts.isJsxOpeningElement(holder) || ts.isJsxSelfClosingElement(holder)) &&
    holder.tagName === callee
  ) {
    return { kind: 'jsx', node: holder };
  }
  return 'other';
};

/**
 * Finds, per production file of the program, every parameter, destructured property or default value whose call sites outside test files all give it the same thing: each omits it, each passes the same constant, or each passes it, so its default never applies. A function referenced in a production file other than as a callee or JSX tag is skipped, since what it receives there is unknown.
 * @param {import('typescript').Program} program
 * @returns {Map<string, Finding[]>} findings keyed by posix file path
 */
export const findConstantArguments = (program) => {
  const checker = program.getTypeChecker();
  const sourceFiles = program
    .getSourceFiles()
    .filter(
      (sourceFile) =>
        !sourceFile.isDeclarationFile &&
        !sourceFile.fileName.includes('/node_modules/'),
    );
  const productionFiles = sourceFiles.filter(
    (sourceFile) => !isTestFile(toPosix(sourceFile.fileName)),
  );

  /** @type {Map<import('typescript').Symbol, number>} */
  const symbolIds = new Map();
  /** @param {import('typescript').Symbol} symbol */
  const idOf = (symbol) => {
    const known = symbolIds.get(symbol);
    if (known !== undefined) {
      return known;
    }
    symbolIds.set(symbol, symbolIds.size);
    return symbolIds.size - 1;
  };

  /** @type {Map<import('typescript').Symbol, Candidate>} */
  const candidates = new Map();
  /** @type {Set<import('typescript').Node>} declaration names, which are no references */
  const declarationNames = new Set();
  /** @type {Map<Candidate, string>} */
  const fileOfCandidate = new Map();
  for (const sourceFile of productionFiles) {
    /** @param {import('typescript').Node} node */
    const collect = (node) => {
      const declaration = functionDeclaredBy(node);
      if (
        declaration &&
        (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) &&
        node.name &&
        ts.isIdentifier(node.name)
      ) {
        const symbol = referencedSymbolOf(checker, node.name);
        const slots = slotsOf(declaration).filter(
          (slot) => !isLibraryDeclaredProperty(checker, slot),
        );
        if (symbol && slots.length > 0) {
          /** @type {Candidate} */
          const candidate = {
            name: node.name.text,
            slots,
            sites: [],
            escaped: false,
          };
          candidates.set(symbol, candidate);
          fileOfCandidate.set(candidate, toPosix(sourceFile.fileName));
          declarationNames.add(node.name);
        }
      }
      ts.forEachChild(node, collect);
    };
    collect(sourceFile);
  }

  const candidateNames = new Set(
    [...candidates.values()].map(({ name }) => name),
  );
  for (const sourceFile of productionFiles) {
    /** @param {import('typescript').Node} node */
    const visit = (node) => {
      if (
        ts.isIdentifier(node) &&
        candidateNames.has(node.text) &&
        !declarationNames.has(node)
      ) {
        const symbol = referencedSymbolOf(checker, node);
        const candidate = symbol ? candidates.get(symbol) : undefined;
        if (candidate) {
          const role = roleOf(node);
          if (role === 'other') {
            candidate.escaped = true;
          } else if (role !== 'neutral') {
            candidate.sites.push(role);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  /** @type {Map<string, Finding[]>} */
  const findings = new Map();
  for (const candidate of candidates.values()) {
    if (candidate.escaped || candidate.sites.length === 0) {
      continue;
    }
    for (const slot of candidate.slots) {
      const finding = findingFor(
        slot,
        candidate.sites.map((site) => argumentAt(checker, idOf, site, slot)),
      );
      if (finding) {
        const fileName = /** @type {string} */ (fileOfCandidate.get(candidate));
        const fileFindings = findings.get(fileName) ?? [];
        fileFindings.push({
          start: finding.node.getStart(),
          end: finding.node.getEnd(),
          messageId: finding.messageId,
          data: { ...finding.data, function: candidate.name },
        });
        findings.set(fileName, fileFindings);
      }
    }
  }
  return findings;
};

/** @type {WeakMap<import('typescript').Program, Map<string, Finding[]>>} one analysis per program, so a run over the whole project walks every file once */
const findingsCache = new WeakMap();

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow a parameter, destructured property or default value that every call site outside test files fills the same way.',
    },
    schema: [],
    messages: {
      alwaysOmitted:
        "Every production call of '{{function}}' omits '{{name}}', so it always holds {{fallback}}. Remove it.",
      alwaysSame:
        "Every production call of '{{function}}' passes {{value}} for '{{name}}'. Remove the parameter and use that value inside.",
      defaultNeverUsed:
        "Every production call of '{{function}}' passes '{{name}}', so its default {{value}} never applies. Remove the default.",
    },
  },
  create(context) {
    /** @type {import('typescript').Program | null | undefined} */
    const program = context.sourceCode.parserServices?.program;
    const filename = toPosix(context.filename);
    if (!program || isTestFile(filename)) {
      return {};
    }
    return {
      Program: () => {
        let findings = findingsCache.get(program);
        if (!findings) {
          findings = findConstantArguments(program);
          findingsCache.set(program, findings);
        }
        for (const { start, end, messageId, data } of findings.get(filename) ??
          []) {
          context.report({
            loc: {
              start: context.sourceCode.getLocFromIndex(start),
              end: context.sourceCode.getLocFromIndex(end),
            },
            messageId,
            data,
          });
        }
      },
    };
  },
};
