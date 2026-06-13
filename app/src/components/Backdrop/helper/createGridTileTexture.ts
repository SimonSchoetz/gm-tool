import { Application, Color, Graphics } from 'pixi.js';
import { getColor } from './getColor';

export const createGridTileTexture = (app: Application, squareSize: number) => {
  const parentSize = squareSize;
  const bgRgb = getColor('--color-bg-rgb');
  const primaryRgb = getColor('--color-primary-rgb');
  const childSize = parentSize / 2;
  const bgColor = new Color(`rgb(${bgRgb})`);
  const primaryColor = new Color(`rgb(${primaryRgb})`);

  const g = new Graphics();

  g.rect(0, 0, parentSize, parentSize).fill({
    color: new Color(primaryColor),
    alpha: 0.1,
  });

  g.rect(0, 0, parentSize - 1, parentSize - 1).fill({
    color: new Color(bgColor),
    alpha: 0.8,
  });

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      g.rect(
        j * childSize + (j > 0 ? 0.25 : 0),
        i * childSize + (i > 0 ? 0.25 : 0),
        childSize - 1.5,
        childSize - 1.5,
      ).fill({ color: new Color(bgColor) });
    }
  }

  return app.renderer.textureGenerator.generateTexture(g);
};
