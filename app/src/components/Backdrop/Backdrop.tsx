import {
  Application,
  Color,
  Graphics,
  RenderTexture,
  Sprite,
  Ticker,
  TilingSprite,
} from 'pixi.js';
import { useEffect, useRef } from 'react';
import {
  createGridTileTexture,
  generateZigzagPath,
  getCumulativeLengths,
  getColor,
  getPositionOnPath,
  setGridDimensions,
} from './helper';
import type { Grid } from './types';
import './Backdrop.css';

const AMOUNT_BEAMS = 5;
const BEAM_SPEED = 0.15;
const BEAM_TAIL_ALPHA = 0.05;
const IDLE_RESPAWN_DELAY_MS = 2000;

type Beam = {
  path: { x: number; y: number }[];
  cumulativeLengths: number[];
  headDistance: number;
  speed: number;
  active: boolean;
};

export const Backdrop = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<Grid>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let app: Application | null = null;
    let tilingSprite: TilingSprite | null = null;
    let beamRenderTexture: RenderTexture | null = null;
    let beamSprite: Sprite | null = null;
    let tileTexture: ReturnType<typeof createGridTileTexture> | null = null;
    let idleTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const beams: Beam[] = Array.from({ length: AMOUNT_BEAMS }, () => ({
      path: [],
      cumulativeLengths: [],
      headDistance: 0,
      speed: BEAM_SPEED,
      active: false,
    }));

    const spawnBeam = (beam: Beam) => {
      beam.path = generateZigzagPath(gridRef);
      beam.cumulativeLengths = getCumulativeLengths(beam.path);
      beam.headDistance = 0;
      beam.speed = BEAM_SPEED * (0.8 + Math.random() * 0.4);
      beam.active = true;
    };

    const spawnAllBeams = () => {
      beams.forEach(spawnBeam);
      app?.ticker.start();
    };

    const init = async () => {
      const bgRgb = getColor('--color-bg-rgb');
      const primaryRgb = getColor('--color-primary-rgb');
      const primaryColor = getColor('--color-primary');
      const [br, bg_c, bb] = bgRgb.split(',').map(Number);
      const [pr, pg, pb] = primaryRgb.split(',').map(Number);
      const compositeR = Math.round(br + pr * 0.1);
      const compositeG = Math.round(bg_c + pg * 0.1);
      const compositeB = Math.round(bb + pb * 0.1);
      const bgCompositeColor = `rgb(${compositeR}, ${compositeG}, ${compositeB})`;

      app = new Application();
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: new Color(bgCompositeColor),
        resolution: window.devicePixelRatio,
        autoDensity: true,
        preference: 'webgl',
      });

      if (cancelled) {
        app.destroy({ removeView: true }, true);
        return;
      }

      const pixiApp = app;
      container.appendChild(pixiApp.canvas);

      setGridDimensions(gridRef);
      const grid = gridRef.current;
      if (!grid) return;

      tileTexture = createGridTileTexture(pixiApp, grid.squareSize);
      tilingSprite = new TilingSprite({
        texture: tileTexture,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      pixiApp.stage.addChild(tilingSprite);

      beamRenderTexture = RenderTexture.create({
        width: window.innerWidth,
        height: window.innerHeight,
        dynamic: true,
      });
      pixiApp.renderer.clear({
        target: beamRenderTexture,
        clearColor: new Color(bgCompositeColor),
      });
      beamSprite = new Sprite(beamRenderTexture);
      pixiApp.stage.addChild(beamSprite);

      pixiApp.ticker.maxFPS = 30;

      const fadeGraphics = new Graphics();
      const headGraphics = new Graphics();

      pixiApp.ticker.add((ticker: Ticker) => {
        if (!beamRenderTexture) return;
        const brt = beamRenderTexture;
        const { deltaMS } = ticker;

        fadeGraphics
          .clear()
          .rect(0, 0, window.innerWidth, window.innerHeight)
          .fill({ color: new Color(`rgb(${bgRgb})`), alpha: BEAM_TAIL_ALPHA });
        pixiApp.renderer.render({
          container: fadeGraphics,
          target: brt,
          clear: false,
        });

        headGraphics.clear();
        let anyActive = false;

        for (const beam of beams) {
          if (!beam.active) continue;
          anyActive = true;

          const totalLength = beam.cumulativeLengths.at(-1) ?? 0;
          const prevDistance = beam.headDistance;
          beam.headDistance += beam.speed * deltaMS;

          if (beam.headDistance >= totalLength) {
            beam.active = false;
            continue;
          }

          const pos = getPositionOnPath(
            beam.path,
            beam.cumulativeLengths,
            beam.headDistance,
          );
          const prevPos = getPositionOnPath(
            beam.path,
            beam.cumulativeLengths,
            Math.max(0, prevDistance),
          );

          if (pos && prevPos) {
            headGraphics
              .moveTo(prevPos.x, prevPos.y)
              .lineTo(pos.x, pos.y)
              .stroke({ width: 2, color: new Color(primaryColor), alpha: 1 });
          }
        }

        pixiApp.renderer.render({
          container: headGraphics,
          target: brt,
          clear: false,
        });

        if (!anyActive) {
          pixiApp.ticker.stop();
          idleTimeoutId = setTimeout(spawnAllBeams, IDLE_RESPAWN_DELAY_MS);
        }
      });

      spawnAllBeams();
    };

    const buildCompositeColor = () => {
      const bgRgb = getColor('--color-bg-rgb');
      const primaryRgb = getColor('--color-primary-rgb');
      const [br, bg_c, bb] = bgRgb.split(',').map(Number);
      const [pr, pg, pb] = primaryRgb.split(',').map(Number);
      return `rgb(${Math.round(br + pr * 0.1)}, ${Math.round(bg_c + pg * 0.1)}, ${Math.round(bb + pb * 0.1)})`;
    };

    const handleResize = () => {
      if (!app || !tilingSprite || !beamSprite) return;
      const grid = gridRef.current;
      if (!grid) return;

      app.renderer.resize(window.innerWidth, window.innerHeight);
      tilingSprite.width = window.innerWidth;
      tilingSprite.height = window.innerHeight;

      setGridDimensions(gridRef);

      tileTexture?.destroy(true);
      tileTexture = createGridTileTexture(app, grid.squareSize);
      tilingSprite.texture = tileTexture;

      beamRenderTexture?.destroy(true);
      beamRenderTexture = RenderTexture.create({
        width: window.innerWidth,
        height: window.innerHeight,
        dynamic: true,
      });
      app.renderer.clear({
        target: beamRenderTexture,
        clearColor: new Color(buildCompositeColor()),
      });
      beamSprite.texture = beamRenderTexture;

      if (idleTimeoutId !== null) {
        clearTimeout(idleTimeoutId);
        idleTimeoutId = null;
      }
      beams.forEach((b) => {
        b.active = false;
      });
      spawnAllBeams();
    };

    window.addEventListener('resize', handleResize);
    void init();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      if (idleTimeoutId !== null) clearTimeout(idleTimeoutId);
      if (app) {
        app.ticker.stop();
        app.destroy({ removeView: true }, true);
        app = null;
      }
    };
  }, []);

  return <div ref={containerRef} className='backdrop-container' />;
};
