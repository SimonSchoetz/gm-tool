import { Application, Color, Graphics } from 'pixi.js';
import { getColor } from './getColor';

export const createGridTileTexture = (app: Application, squareSize: number) => {
  const bgColor = getColor('--color-bg');
  const bgRgb = getColor('--color-bg-rgb');
  const innerSize = (squareSize - 1) / 2;

  const g = new Graphics();

  g.rect(0, 0, squareSize - 0.5, squareSize - 0.5).fill({
    color: new Color(`rgb(${bgRgb})`),
    alpha: 0.5,
  });

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      g.rect(
        j * innerSize + (j > 0 ? 1 : 0),
        i * innerSize + (i > 0 ? 1 : 0),
        innerSize - (j > 0 ? 1 : 0),
        innerSize - (i > 0 ? 1 : 0),
      ).fill({ color: new Color(bgColor) });
    }
  }

  return app.renderer.textureGenerator.generateTexture(g);
};
