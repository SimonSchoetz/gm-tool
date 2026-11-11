import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Color, Graphics, Rectangle } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { RenderTexture } from 'pixi.js';
import { createGridTileTexture } from '../createGridTileTexture';

const cssVariables = new Map([
  ['--color-bg-rgb', '3, 19, 34'],
  ['--color-primary-rgb', '57, 156, 187'],
]);

const makeMockApp = (mockTexture: RenderTexture) => {
  const generateTexture = vi.fn().mockReturnValue(mockTexture);
  const app = {
    renderer: { textureGenerator: { generateTexture } },
  } as unknown as Application;
  return { app, generateTexture };
};

describe('createGridTileTexture', () => {
  beforeEach(() => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => cssVariables.get(prop) ?? '',
    } as unknown as CSSStyleDeclaration);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls generateTexture once with a Graphics target and exact frame', () => {
    const mockTexture = {} as RenderTexture;
    const { app, generateTexture } = makeMockApp(mockTexture);
    createGridTileTexture(app, 120);
    expect(generateTexture).toHaveBeenCalledTimes(1);
    expect(generateTexture).toHaveBeenCalledWith({
      target: expect.any(Graphics) as unknown,
      frame: expect.any(Rectangle) as unknown,
    });
  });

  it('returns the texture produced by generateTexture', () => {
    const mockTexture = {} as RenderTexture;
    const { app } = makeMockApp(mockTexture);
    const result = createGridTileTexture(app, 120);
    expect(result).toBe(mockTexture);
  });

  describe('the tile it draws', () => {
    const SQUARE = 100;
    const HALF = SQUARE / 2;

    const drawTile = () => {
      const rect = vi.spyOn(Graphics.prototype, 'rect');
      const fill = vi.spyOn(Graphics.prototype, 'fill');
      const { app } = makeMockApp({} as RenderTexture);
      createGridTileTexture(app, SQUARE);
      return { rect, fill };
    };

    const hexOf = (style: unknown) => (style as { color: Color }).color.toHex();

    it('draws the primary outline square, the background square one pixel smaller and four background cells', () => {
      const { rect } = drawTile();

      expect(rect.mock.calls).toEqual([
        [0, 0, SQUARE, SQUARE],
        [0, 0, SQUARE - 1, SQUARE - 1],
        [0, 0, HALF - 1.5, HALF - 1.5],
        [HALF + 0.25, 0, HALF - 1.5, HALF - 1.5],
        [0, HALF + 0.25, HALF - 1.5, HALF - 1.5],
        [HALF + 0.25, HALF + 0.25, HALF - 1.5, HALF - 1.5],
      ]);
    });

    it('fills the outline with the primary color at one tenth, the square with the background at four fifths and the cells with the background', () => {
      const { fill } = drawTile();

      expect(fill).toHaveBeenCalledTimes(6);
      expect(fill.mock.calls[0][0]).toMatchObject({ alpha: 0.1 });
      expect(hexOf(fill.mock.calls[0][0])).toBe(
        new Color('rgb(57, 156, 187)').toHex(),
      );
      expect(fill.mock.calls[1][0]).toMatchObject({ alpha: 0.8 });
      expect(hexOf(fill.mock.calls[1][0])).toBe(
        new Color('rgb(3, 19, 34)').toHex(),
      );
      for (const [style] of fill.mock.calls.slice(2)) {
        expect(hexOf(style)).toBe(new Color('rgb(3, 19, 34)').toHex());
      }
    });
  });
});
