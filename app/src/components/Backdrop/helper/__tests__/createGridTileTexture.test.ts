import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Graphics } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { RenderTexture } from 'pixi.js';
import { createGridTileTexture } from '../createGridTileTexture';

const cssVariables = new Map([['--color-bg-rgb', '3, 19, 34']]);

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

  it('calls generateTexture once with a Graphics container', () => {
    const mockTexture = {} as RenderTexture;
    const { app, generateTexture } = makeMockApp(mockTexture);
    createGridTileTexture(app, 120);
    expect(generateTexture).toHaveBeenCalledTimes(1);
    expect(generateTexture).toHaveBeenCalledWith(expect.any(Graphics));
  });

  it('returns the texture produced by generateTexture', () => {
    const mockTexture = {} as RenderTexture;
    const { app } = makeMockApp(mockTexture);
    const result = createGridTileTexture(app, 120);
    expect(result).toBe(mockTexture);
  });
});
