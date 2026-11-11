// Finds raw values in a stylesheet that equal what a design token resolves to, comparing canonical forms: colours as `r,g,b,a` whether written as hex, `rgb()` or a bare `r, g, b` triplet, lengths as px at a 16px root.
// A value is compared only with the token family its property belongs to, so `border-radius: 8px` matches `--radius-md` and never `--spacing-sm`: an exact match inside a family is a real duplicate, one across families a numeric coincidence. A property in no family is not checked. A token in no family, or whose value is compound (a shadow, a `calc()`), is skipped.

type TokenIndex = Map<string, string[]>;

type RawValueHit = {
  line: number;
  column: number;
  value: string;
  tokens: string[];
};

const ROOT_FONT_SIZE_PX = 16;
const ONE_OFF_MARKER = 'one-off';
const OPAQUE_ALPHA = 1;

const STYLESHEETS_ROOT = 'app/src/';
const NON_COMPONENT_STYLES_ROOT = 'app/src/styles/';

const BORDER_SIDE =
  '(?:-(?:top|right|bottom|left|block|inline)(?:-start|-end)?)?';

const TOKEN_FAMILIES = {
  colour: {
    tokenPrefix: '--color-',
    // A border shorthand carries a colour as well as a width, so its name is in both families.
    property: new RegExp(
      `^(?:color|fill|stroke|background|[a-z-]+-color|border${BORDER_SIDE})$`,
    ),
  },
  spacing: {
    tokenPrefix: '--spacing-',
    property: /^(?:(?:row-|column-)?gap|(?:padding|margin)(?:-[a-z-]+)?)$/,
  },
  border: {
    tokenPrefix: '--border-',
    property: new RegExp(`^border${BORDER_SIDE}(?:-width)?$`),
  },
  radius: {
    tokenPrefix: '--radius-',
    property: /^border(?:-[a-z]+-[a-z]+)?-radius$/,
  },
  zIndex: { tokenPrefix: '--most-front', property: /^z-index$/ },
};

const familiesOfProperty = (property: string) =>
  Object.values(TOKEN_FAMILIES).filter((family) =>
    family.property.test(property),
  );

const familyOfToken = (name: string) =>
  Object.values(TOKEN_FAMILIES).find((family) =>
    name.startsWith(family.tokenPrefix),
  ) ?? null;

export const isComponentStylesheet = (repositoryPath: string) =>
  repositoryPath.endsWith('.css') &&
  repositoryPath.startsWith(STYLESHEETS_ROOT) &&
  !repositoryPath.startsWith(NON_COMPONENT_STYLES_ROOT);

const NON_DECLARATION_TEXT =
  /\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|url\([^)]*\)/g;
const DECLARATION = /(?:^|[;{}])\s*([-\w]+)\s*:\s*([^;{}]*)(?=[;}])/g;
const RAW_VALUE =
  /(?<![-\w.#])(?:#[0-9a-f]{3,8}\b|rgba?\([^()]*\)|\d*\.?\d+(?:px|rem)\b)/gi;
const TRIPLET = /^\d+\s*,\s*\d+\s*,\s*\d+$/;
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_FUNCTION = /^rgba?\(([^()]*)\)$/i;
const CHANNEL_SEPARATOR = /[\s,/]+/;
const LENGTH = /^(\d*\.?\d+)(px|rem)$/i;
const INTEGER = /^\d+$/;
const VAR_REFERENCE = /var\(\s*(--[-\w]+)\s*\)/g;

const colourKey = (red: number, green: number, blue: number, alpha: number) =>
  `colour:${red},${green},${blue},${Number(alpha.toFixed(2))}`;

const hexColourKey = (hex: string) => {
  const digits = hex.slice(1);
  const fullDigits = digits.length <= 4 ? digits.replace(/./g, '$&$&') : digits;
  const channel = (index: number) =>
    parseInt(fullDigits.slice(index, index + 2), 16);
  const alpha = fullDigits.length === 8 ? channel(6) / 255 : OPAQUE_ALPHA;
  return colourKey(channel(0), channel(2), channel(4), alpha);
};

const parseAlpha = (alpha: string | undefined) => {
  if (alpha === undefined) return OPAQUE_ALPHA;
  return alpha.endsWith('%') ? parseFloat(alpha) / 100 : parseFloat(alpha);
};

const rgbFunctionKey = (args: string) => {
  const parts = args.trim().split(CHANNEL_SEPARATOR);
  if (parts.length < 3 || parts.length > 4) return null;
  const channels = parts.slice(0, 3).map(Number);
  const alpha = parseAlpha(parts[3]);
  if (channels.some(Number.isNaN) || Number.isNaN(alpha)) return null;
  return colourKey(channels[0], channels[1], channels[2], alpha);
};

const canonicalKey = (value: string) => {
  const trimmed = value.trim();
  if (INTEGER.test(trimmed)) return `integer:${Number(trimmed)}`;
  if (HEX.test(trimmed)) return hexColourKey(trimmed);
  if (TRIPLET.test(trimmed)) return rgbFunctionKey(trimmed);
  const rgbArgs = RGB_FUNCTION.exec(trimmed)?.[1];
  if (rgbArgs !== undefined) return rgbFunctionKey(rgbArgs);
  const length = LENGTH.exec(trimmed);
  if (!length) return null;
  const px =
    parseFloat(length[1]) *
    (length[2].toLowerCase() === 'rem' ? ROOT_FONT_SIZE_PX : 1);
  return `length:${Number(px.toFixed(4))}`;
};

// Comments, strings and url() contents are blanked in place, so offsets into the result are offsets into the source.
const blankNonDeclarationText = (css: string) => {
  const oneOffLines = new Set<number>();
  const text = css.replace(NON_DECLARATION_TEXT, (match, offset: number) => {
    if (match.startsWith('/*')) {
      const firstLine = lineAt(css, offset);
      match.split('\n').forEach((commentLine, index) => {
        if (commentLine.includes(ONE_OFF_MARKER)) {
          oneOffLines.add(firstLine + index);
        }
      });
    }
    return match.replace(/[^\n]/g, ' ');
  });
  return { text, oneOffLines };
};

const lineAt = (text: string, offset: number) =>
  text.slice(0, offset).split('\n').length;

const columnAt = (text: string, offset: number) =>
  offset - text.lastIndexOf('\n', offset - 1);

const declarationsOf = (text: string) =>
  [...text.matchAll(DECLARATION)].map((match) => ({
    property: match[1].toLowerCase(),
    value: match[2],
    valueOffset: match.index + match[0].length - match[2].length,
  }));

const resolveVarReferences = (
  value: string,
  definitions: Map<string, string>,
  visiting: Set<string>,
): string | null => {
  let resolved = value;
  for (const [reference, name] of value.matchAll(VAR_REFERENCE)) {
    const definition = definitions.get(name) ?? null;
    if (definition === null || visiting.has(name)) return null;
    const inner = resolveVarReferences(
      definition,
      definitions,
      new Set(visiting).add(name),
    );
    if (inner === null) return null;
    resolved = resolved.replace(reference, () => inner);
  }
  return resolved;
};

const keyInFamily = (tokenPrefix: string, key: string) =>
  `${tokenPrefix}|${key}`;

export const buildTokenIndex = (variableSheets: string[]): TokenIndex => {
  const definitions = new Map<string, string>();
  for (const sheet of variableSheets) {
    for (const { property, value } of declarationsOf(
      blankNonDeclarationText(sheet).text,
    )) {
      definitions.set(property, value.trim());
    }
  }
  const index: TokenIndex = new Map();
  for (const [name, definition] of definitions) {
    const resolved = resolveVarReferences(
      definition,
      definitions,
      new Set([name]),
    );
    if (resolved === null) continue;
    const family = familyOfToken(name);
    const key = canonicalKey(resolved);
    if (family === null || key === null) continue;
    const familyKey = keyInFamily(family.tokenPrefix, key);
    index.set(familyKey, [...(index.get(familyKey) ?? []), name]);
  }
  return index;
};

const rawValuesOf = (property: string, value: string) => {
  const trimmed = value.trim();
  if (TOKEN_FAMILIES.zIndex.property.test(property) && INTEGER.test(trimmed)) {
    return [{ raw: trimmed, offset: 0, key: canonicalKey(trimmed) }];
  }
  return [...value.matchAll(RAW_VALUE)].map((match) => ({
    raw: match[0],
    offset: match.index,
    key: canonicalKey(match[0]),
  }));
};

const tokensEqualTo = (property: string, key: string, index: TokenIndex) =>
  familiesOfProperty(property).flatMap(
    (family) => index.get(keyInFamily(family.tokenPrefix, key)) ?? [],
  );

export const findRawValueHits = (
  css: string,
  index: TokenIndex,
): RawValueHit[] => {
  const { text, oneOffLines } = blankNonDeclarationText(css);
  return declarationsOf(text).flatMap(({ property, value, valueOffset }) =>
    rawValuesOf(property, value).flatMap(({ raw, offset, key }) => {
      const tokens = key === null ? [] : tokensEqualTo(property, key, index);
      const position = valueOffset + offset;
      const line = lineAt(text, position);
      if (tokens.length === 0 || oneOffLines.has(line)) return [];
      return [{ line, column: columnAt(text, position), value: raw, tokens }];
    }),
  );
};
