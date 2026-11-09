import { describe, it, expect } from 'vitest';
import { buildTokenIndex, findRawValueHits } from '../css-token-check-find.ts';

const VARIABLES = `:root {
  --color-primary-rgb: 57, 156, 187;
  --color-primary: rgb(var(--color-primary-rgb));
  --color-primary-muted: rgb(var(--color-primary-rgb), 0.5);
  --color-text: var(--color-primary);
  --spacing-sm: 0.5rem; /* eight pixels */
  --line: 24px;
  --most-front: 1000;
  --font-weight-normal: 400;
  --shadow: 0 0.125rem 0.375rem rgb(0, 0, 0, 0.3);
  --dangling: var(--missing);
  --loop-a: var(--loop-b);
  --loop-b: var(--loop-a);
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
    const shortHexIndex = buildTokenIndex([':root { --white: #ffffff; }']);
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

  it('reports a bare triplet declared on a custom property', () => {
    expect(hitValues(inRule('--local-rgb: 57, 156, 187'))).toEqual([
      '57, 156, 187',
    ]);
  });
});

describe('length comparison', () => {
  it.each(['8px', '0.5rem', '.5rem'])('reports %s as --spacing-sm', (raw) => {
    expect(findRawValueHits(inRule(`gap: ${raw}`), index)[0].tokens).toEqual([
      '--spacing-sm',
    ]);
  });

  it('reports 1.5rem as equal to a token written in px', () => {
    expect(findRawValueHits(inRule('height: 1.5rem'), index)[0].tokens).toEqual(
      ['--line'],
    );
  });

  it('finds each matching value of a compound declaration', () => {
    expect(hitValues(inRule('padding: 8px 3px 24px'))).toEqual(['8px', '24px']);
  });

  it('finds a value inside calc()', () => {
    expect(hitValues(inRule('width: calc(100% - 8px)'))).toEqual(['8px']);
  });

  it('does not report a negative value, which has no token of its own', () => {
    expect(hitValues(inRule('margin: -8px'))).toEqual([]);
  });

  it('does not read a digit run inside a longer number', () => {
    expect(hitValues(inRule('width: 18px'))).toEqual([]);
    expect(hitValues(inRule('width: 1.8px'))).toEqual([]);
  });
});

describe('z-index comparison', () => {
  it('reports an integer equal to a numeric token', () => {
    expect(findRawValueHits(inRule('z-index: 1000'), index)[0].tokens).toEqual([
      '--most-front',
    ]);
  });

  it('does not compare a z-index with a font weight', () => {
    expect(hitValues(inRule('z-index: 400'))).toEqual([]);
  });

  it('does not treat an integer on another property as a z-index', () => {
    expect(hitValues(inRule('order: 1000'))).toEqual([]);
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
    expect(hitValues(inRule('box-shadow: rgb(0, 0, 0, 0.3)'))).toEqual([]);
  });

  it('skips tokens that cannot be resolved', () => {
    expect([...index.values()].flat()).not.toEqual(
      expect.arrayContaining(['--dangling']),
    );
    expect([...index.values()].flat()).not.toEqual(
      expect.arrayContaining(['--loop-a']),
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
      hitValues('.a {\n  /* one-off */\n  gap: 8px;\n  height: 24px; }'),
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
