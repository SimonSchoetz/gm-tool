import { describe, it, expect } from 'vitest';
import {
  buildTokenIndex,
  findRawValueHits,
  isComponentStylesheet,
} from '../css-token-check-find.ts';

const VARIABLES = `:root {
  --color-primary-rgb: 57, 156, 187;
  --color-primary: rgb(var(--color-primary-rgb));
  --color-primary-muted: rgb(var(--color-primary-rgb), 0.5);
  --color-text: var(--color-primary);
  --spacing-sm: 0.5rem; /* eight pixels */
  --spacing-lg: 24px;
  --radius-md: 0.5rem;
  --border-thin: 1px;
  --most-front: 1000;
  --shadow: 0 0.125rem 0.375rem rgb(0, 0, 0, 0.3);
  --color-dangling: var(--missing);
  --color-loop-a: var(--color-loop-b);
  --color-loop-b: var(--color-loop-a);
}`;

const index = buildTokenIndex([VARIABLES]);
const hitValues = (css: string) =>
  findRawValueHits(css, index).map((hit) => hit.value);
const inRule = (declaration: string) => `.a { ${declaration}; }`;

describe('colour comparison', () => {
  it.each([
    '#399cbb',
    '#399CBB',
    '#399cbbff',
    'rgb(57, 156, 187)',
    'rgba(57,156,187,1)',
    'rgb(57 156 187)',
    'rgb(57 156 187 / 100%)',
  ])('reports %s as equal to the primary colour', (raw) => {
    const [hit] = findRawValueHits(inRule(`color: ${raw}`), index);
    expect(hit.value).toBe(raw);
    expect(hit.tokens).toEqual([
      '--color-primary-rgb',
      '--color-primary',
      '--color-text',
    ]);
  });

  it('expands short hex', () => {
    const shortHexIndex = buildTokenIndex([
      ':root { --color-white: #ffffff; }',
    ]);
    expect(findRawValueHits(inRule('color: #fff'), shortHexIndex)).toHaveLength(
      1,
    );
  });

  it.each(['rgba(57, 156, 187, 0.5)', 'rgb(57 156 187 / 50%)', '#399cbb80'])(
    'matches the alpha of %s against the alpha token only',
    (raw) => {
      expect(
        findRawValueHits(inRule(`color: ${raw}`), index)[0].tokens,
      ).toEqual(['--color-primary-muted']);
    },
  );

  it('does not report a colour one channel off a token', () => {
    expect(hitValues(inRule('color: #399cbc'))).toEqual([]);
  });

  it('does not report a token colour at another alpha', () => {
    expect(hitValues(inRule('color: rgb(57, 156, 187, 0.4)'))).toEqual([]);
  });
});

describe('length comparison', () => {
  it.each(['8px', '0.5rem', '.5rem'])('reports %s as --spacing-sm', (raw) => {
    expect(findRawValueHits(inRule(`gap: ${raw}`), index)[0].tokens).toEqual([
      '--spacing-sm',
    ]);
  });

  it('reports 1.5rem as equal to a token written in px', () => {
    expect(findRawValueHits(inRule('gap: 1.5rem'), index)[0].tokens).toEqual([
      '--spacing-lg',
    ]);
  });

  it('finds each matching value of a compound declaration', () => {
    expect(hitValues(inRule('padding: 8px 3px 24px'))).toEqual(['8px', '24px']);
  });

  it('finds a value inside calc()', () => {
    expect(hitValues(inRule('margin-top: calc(100% - 8px)'))).toEqual(['8px']);
  });

  it('does not report a negative value, which has no token of its own', () => {
    expect(hitValues(inRule('margin: -8px'))).toEqual([]);
  });

  it('does not read a digit run inside a longer number', () => {
    expect(hitValues(inRule('gap: 18px'))).toEqual([]);
    expect(hitValues(inRule('gap: 1.8px'))).toEqual([]);
  });
});

describe('z-index comparison', () => {
  it('reports an integer equal to a numeric token', () => {
    expect(findRawValueHits(inRule('z-index: 1000'), index)[0].tokens).toEqual([
      '--most-front',
    ]);
  });

  it('does not treat an integer on another property as a z-index', () => {
    expect(hitValues(inRule('order: 1000'))).toEqual([]);
  });
});

describe('token family matching', () => {
  it.each([
    ['gap', '--spacing-sm'],
    ['row-gap', '--spacing-sm'],
    ['padding-left', '--spacing-sm'],
    ['margin-block-end', '--spacing-sm'],
    ['border-radius', '--radius-md'],
    ['border-top-left-radius', '--radius-md'],
  ])('compares %s only with its own family', (property, token) => {
    expect(
      findRawValueHits(inRule(`${property}: 8px`), index)[0].tokens,
    ).toEqual([token]);
  });

  it.each(['border-width', 'border', 'border-top', 'border-left-width'])(
    'compares %s with border tokens',
    (property) => {
      expect(
        findRawValueHits(inRule(`${property}: 1px`), index)[0].tokens,
      ).toEqual(['--border-thin']);
    },
  );

  it.each([
    'color',
    'background',
    'background-color',
    'border-color',
    'border-top-color',
    'fill',
    'stroke',
  ])('compares %s with colour tokens', (property) => {
    expect(hitValues(inRule(`${property}: #399cbb`))).toEqual(['#399cbb']);
  });

  it('finds both the width and the colour of a border shorthand', () => {
    expect(hitValues(inRule('border: 1px solid #399cbb'))).toEqual([
      '1px',
      '#399cbb',
    ]);
  });

  it.each([
    'width: 8px',
    'font-size: 8px',
    'border-spacing: 8px',
    'box-shadow: 0 0 8px #399cbb',
    '--local: 8px',
    '--local-rgb: 57, 156, 187',
  ])('does not flag %s, whose property is in no family', (declaration) => {
    expect(hitValues(inRule(declaration))).toEqual([]);
  });

  it('does not flag a length that equals only another family', () => {
    expect(hitValues(inRule('border-radius: 24px'))).toEqual([]);
    expect(hitValues(inRule('gap: 1px'))).toEqual([]);
    expect(hitValues(inRule('border-width: 8px'))).toEqual([]);
  });

  it('skips a token in no family', () => {
    const noFamily = buildTokenIndex([':root { --blur: 8px; }']);
    expect(findRawValueHits(inRule('gap: 8px'), noFamily)).toEqual([]);
  });
});

describe('isComponentStylesheet', () => {
  it.each([
    ['app/src/components/Button/Button.css', true],
    ['app/src/styles/variables/color-variables.css', false],
    ['app/src/styles/global.css', false],
    ['app/src/components/Button/Button.tsx', false],
    ['app/public/page.css', false],
  ])('classifies %s', (file, expected) => {
    expect(isComponentStylesheet(file)).toBe(expected);
  });
});

describe('what is not a raw value', () => {
  it('ignores a token reference', () => {
    expect(hitValues(inRule('gap: var(--spacing-sm)'))).toEqual([]);
  });

  it('ignores rgb() built on a token', () => {
    expect(
      hitValues(inRule('color: rgb(var(--color-primary-rgb), 0.5)')),
    ).toEqual([]);
  });

  it('ignores a digit in a custom property name', () => {
    expect(hitValues(inRule('gap: var(--gap-8px)'))).toEqual([]);
  });

  it('ignores a media query, where var() cannot be used', () => {
    expect(
      hitValues('@media (max-width: 24px) { .a { color: red; } }'),
    ).toEqual([]);
  });

  it('ignores an id selector and a pseudo-class', () => {
    expect(hitValues('#399cbb:hover { color: red; }')).toEqual([]);
  });

  it('ignores a value inside a comment, a string or a url()', () => {
    expect(hitValues('.a { /* gap: 8px; */ color: red; }')).toEqual([]);
    expect(hitValues(inRule(`content: '8px'`))).toEqual([]);
    expect(hitValues(inRule('background: url(a#399cbb.svg)'))).toEqual([]);
  });

  it('skips a token whose value is compound', () => {
    expect(hitValues(inRule('background: rgb(0, 0, 0, 0.3)'))).toEqual([]);
  });

  it('skips tokens that cannot be resolved', () => {
    expect([...index.values()].flat()).not.toEqual(
      expect.arrayContaining(['--color-dangling']),
    );
    expect([...index.values()].flat()).not.toEqual(
      expect.arrayContaining(['--color-loop-a']),
    );
  });
});

describe('one-off exemption', () => {
  it('exempts a value with a one-off comment on its line', () => {
    expect(hitValues('.a {\n  gap: 8px; /* one-off */\n}')).toEqual([]);
  });

  it('exempts a value whose comment says more than the marker', () => {
    expect(
      hitValues('.a {\n  gap: 8px; /* one-off: aligns the icon */\n}'),
    ).toEqual([]);
  });

  it('does not exempt a value on another line', () => {
    expect(
      hitValues('.a {\n  /* one-off */\n  gap: 8px;\n  padding: 24px; }'),
    ).toEqual(['8px', '24px']);
  });

  it('does not exempt on an unrelated comment', () => {
    expect(hitValues('.a {\n  gap: 8px; /* spacing */\n}')).toEqual(['8px']);
  });

  it('exempts only the line of a multi-line value that holds the marker', () => {
    expect(
      hitValues('.a {\n  padding: 8px /* one-off */\n    24px;\n}'),
    ).toEqual(['24px']);
  });
});

describe('reported position', () => {
  it('names the line and column of the value', () => {
    expect(
      findRawValueHits('.a {\n  color: red;\n  gap: 8px;\n}', index)[0],
    ).toMatchObject({ line: 3, column: 8 });
  });

  it('positions a value on the first line', () => {
    expect(findRawValueHits('.a { gap: 8px; }', index)[0]).toMatchObject({
      line: 1,
      column: 11,
    });
  });

  it('counts lines past a blanked multi-line comment', () => {
    expect(
      findRawValueHits('/* one\n two */\n.a { gap: 8px; }', index)[0].line,
    ).toBe(3);
  });
});

const keysOf = (sheet: string) => [...buildTokenIndex([sheet]).keys()];
const hitsOf = (sheetIndex: ReturnType<typeof buildTokenIndex>, css: string) =>
  findRawValueHits(css, sheetIndex);

describe('which properties belong to a token family', () => {
  const sheet = buildTokenIndex([
    ':root { --spacing-lg: 24px; --radius-md: 0.5rem; --most-front: 1000; --other: 5; }',
  ]);

  it.each([
    'gap',
    'row-gap',
    'column-gap',
    'padding',
    'padding-left',
    'margin-block-start',
  ])('checks 24px in %s against the spacing tokens', (property) => {
    expect(hitsOf(sheet, inRule(`${property}: 24px`))).toHaveLength(1);
  });

  it.each(['grid-gap', 'gap-fill', 'margins', 'xpadding'])(
    'does not check 24px in %s',
    (property) => {
      expect(hitsOf(sheet, inRule(`${property}: 24px`))).toHaveLength(0);
    },
  );

  it.each(['border-radius', 'border-top-left-radius'])(
    'checks 8px in %s against the radius tokens',
    (property) => {
      expect(hitsOf(sheet, inRule(`${property}: 8px`))).toHaveLength(1);
    },
  );

  it.each(['my-border-radius', 'border-radius-x'])(
    'does not check 8px in %s',
    (property) => {
      expect(hitsOf(sheet, inRule(`${property}: 8px`))).toHaveLength(0);
    },
  );

  it('checks a whole number in z-index against the z-index token, with a space before the semicolon', () => {
    expect(hitsOf(sheet, '.a { z-index: 1000 ; }')).toHaveLength(1);
    expect(hitsOf(sheet, '.a { z-index: 5; }')).toHaveLength(0);
    expect(hitsOf(sheet, '.a { z-index-x: 1000; }')).toHaveLength(0);
    expect(hitsOf(sheet, '.a { x-z-index: 1000; }')).toHaveLength(0);
  });

  it('leaves a token with a name in no family out of the index', () => {
    expect(keysOf(':root { --other: 5; --text-size: 24px; }')).toEqual([]);
  });
});

describe('text that is not a declaration', () => {
  const sheet = buildTokenIndex([
    ':root { --color-primary-rgb: 57, 156, 187; }',
  ]);

  it.each([
    ['a double-quoted string', '.a { color: "#399cbb"; }'],
    ['a single-quoted string', ".a { color: '#399cbb'; }"],
    ['a string with an escaped quote', '.a { color: "a\\" #399cbb"; }'],
    [
      'a single-quoted string with an escaped quote',
      ".a { color: 'a\\' #399cbb'; }",
    ],
    ['a url', '.a { background: url(#399cbb); }'],
    ['a comment', '.a { /* color: #399cbb; */ }'],
  ])('is not searched inside %s', (_name, css) => {
    expect(hitsOf(sheet, css)).toHaveLength(0);
  });

  it('reports the true column of a value after a string on its line', () => {
    const [hit] = hitsOf(sheet, '.a { content: "xx"; color: #399cbb; }');

    expect(hit.line).toBe(1);
    expect(hit.column).toBe('.a { content: "xx"; color: '.length + 1);
  });

  it('reports the column of a value on a later line from that line start', () => {
    const [hit] = hitsOf(sheet, '.a {\n  color: #399cbb;\n}');

    expect(hit.line).toBe(2);
    expect(hit.column).toBe('  color: '.length + 1);
  });

  it('reports the column of a second value within a declaration', () => {
    const colours = buildTokenIndex([':root { --spacing-lg: 24px; }']);

    const [hit] = hitsOf(colours, '.a { margin: 0 24px; }');

    expect(hit.column).toBe('.a { margin: 0 '.length + 1);
  });

  it('skips a line a comment marks one-off, also when the comment spans lines and the marker is on a later one', () => {
    expect(
      hitsOf(sheet, '.a {\n  /* first\n one-off */ color: #399cbb;\n}'),
    ).toHaveLength(0);
    expect(
      hitsOf(sheet, '.a { content: "one-off"; color: #399cbb; }'),
    ).toHaveLength(1);
  });

  it('finds a declaration at the very start of the text and one with spaces before the colon or none after it', () => {
    expect(hitsOf(sheet, 'color: #399cbb;')).toHaveLength(1);
    expect(hitsOf(sheet, '.a { color : #399cbb; }')).toHaveLength(1);
    expect(hitsOf(sheet, '.a { color:#399cbb; }')).toHaveLength(1);
  });

  it('does not take text after a selector colon for a declaration', () => {
    expect(hitsOf(sheet, '.a:hover x { color: #399cbb; }')).toHaveLength(1);
    expect(hitsOf(sheet, 'a:b #399cbb')).toHaveLength(0);
  });

  it('does not take text before a declaration that no semicolon or brace ends for a declaration', () => {
    expect(hitsOf(sheet, '.a x color: #399cbb;')).toHaveLength(0);
  });

  it('does not read a length after a hash as a raw value', () => {
    const spacing = buildTokenIndex([':root { --spacing-lg: 24px; }']);

    expect(hitsOf(spacing, '.a { margin: #24px; }')).toHaveLength(0);
  });

  it('does not read a negative length or a length glued to a word as a raw value', () => {
    const spacing = buildTokenIndex([':root { --spacing-lg: 24px; }']);

    expect(hitsOf(spacing, '.a { margin: -24px; }')).toHaveLength(0);
    expect(hitsOf(spacing, '.a { margin: a24px; }')).toHaveLength(0);
    expect(hitsOf(spacing, '.a { margin: 1.24px; }')).toHaveLength(0);
  });

  it('reports no hit for a colour function whose channels cannot be read', () => {
    expect(hitsOf(sheet, '.a { color: rgb(1, 2); }')).toHaveLength(0);
  });
});

describe('how token values are read', () => {
  it.each(['57,156,187', '57 , 156 , 187', '57,  156,   187'])(
    'reads %s as a colour triplet',
    (triplet) => {
      expect(keysOf(`:root { --color-a: ${triplet}; }`)).toEqual([
        '--color-|colour:57,156,187,1',
      ]);
    },
  );

  it.each(['9, 57, 156, 187', '57, 156, 187, 9', '57 156', 'x 57, 156, 187'])(
    'reads %s as no colour',
    (value) => {
      expect(keysOf(`:root { --color-a: ${value}; }`)).toEqual([]);
    },
  );

  it.each(['foo #399cbb', '#399cbb foo', '#39', '#399cbbaabb'])(
    'reads %s as no hex colour',
    (value) => {
      expect(keysOf(`:root { --color-a: ${value}; }`)).toEqual([]);
    },
  );

  it('reads a four-digit hex with its alpha', () => {
    const index = buildTokenIndex([':root { --color-a: #fff8; }']);

    expect(findRawValueHits('.a { color: #ffffff88; }', index)).toHaveLength(1);
  });

  it.each([
    'foo rgb(1, 2, 3)',
    'rgb(1, 2, 3) foo',
    'rgb(1, 2)',
    'rgb(1, 2, 3, 4, 5)',
    'rgb(a, 2, 3)',
    'rgb(1, 2, 3, x)',
  ])('reads %s as no colour', (value) => {
    expect(keysOf(`:root { --color-a: ${value}; }`)).toEqual([]);
  });

  it('reads a colour function with spaces inside its parentheses', () => {
    expect(keysOf(':root { --color-a: rgb( 57, 156, 187 ); }')).toEqual([
      '--color-|colour:57,156,187,1',
    ]);
  });

  it.each(['12.5px', '100px', '0.5rem'])('reads %s as a length', (value) => {
    expect(keysOf(`:root { --spacing-a: ${value}; }`)).toHaveLength(1);
  });

  it.each(['x12px', '12px x', '12.5.5px'])('reads %s as no length', (value) => {
    expect(keysOf(`:root { --spacing-a: ${value}; }`)).toEqual([]);
  });

  it('reads var references with spaces inside the parentheses', () => {
    expect(
      keysOf(':root { --spacing-a: 24px; --spacing-b: var( --spacing-a ); }'),
    ).toEqual(['--spacing-|length:24']);
    expect(
      buildTokenIndex([
        ':root { --spacing-a: 24px; --spacing-b: var( --spacing-a ); }',
      ]).get('--spacing-|length:24'),
    ).toEqual(['--spacing-a', '--spacing-b']);
  });

  it('does not read a plain integer as the z-index token of another number', () => {
    const index = buildTokenIndex([':root { --most-front: 1000; }']);

    expect(findRawValueHits('.a { z-index: 5; }', index)).toHaveLength(0);
  });
});
