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
  buildCompositeColor,
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
const BEAM_SPEED = 0.4;
const BEAM_TAIL_ALPHA = 0.05;
const IDLE_RESPAWN_DELAY_MS = 1000;
const BASE_DELEAY_BETWEEN_BEAMS = 10000;
const FPS = 60;

type Beam = {
  path: { x: number; y: number }[];
  cumulativeLengths: number[];
  headDistance: number;
  speed: number;
  active: boolean;
  spawnDelay: number;
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
    let idleTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const beams: Beam[] = Array.from({ length: AMOUNT_BEAMS }, () => ({
      path: [],
      cumulativeLengths: [],
      headDistance: 0,
      speed: BEAM_SPEED,
      active: false,
      spawnDelay: 0,
    }));

    const spawnBeam = (beam: Beam, delay = 0) => {
      beam.path = generateZigzagPath(gridRef);
      beam.cumulativeLengths = getCumulativeLengths(beam.path);
      beam.headDistance = 0;
      beam.speed = BEAM_SPEED * (0.5 + Math.random() * 0.6);
      beam.spawnDelay = delay;
      beam.active = delay === 0;
    };

    const spawnAllBeams = () => {
      beams.forEach((beam) => {
        spawnBeam(beam, Math.random() * BASE_DELEAY_BETWEEN_BEAMS);
      });
      app?.ticker.start();
    };

    const init = async () => {
      const primaryColor = getColor('--color-primary');
      const bgCompositeColor = buildCompositeColor();

      const newApp = new Application();
      await newApp.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: new Color(bgCompositeColor),
        resolution: window.devicePixelRatio,
        autoDensity: true,
        preference: 'webgl',
      });

      if (cancelled) {
        newApp.destroy({ removeView: true }, true);
        return;
      }

      app = newApp;
      const pixiApp = app;
      container.appendChild(pixiApp.canvas);

      setGridDimensions(gridRef);
      const grid = gridRef.current;
      if (!grid) return;

      const tileTexture = createGridTileTexture(pixiApp, grid.squareSize);
      tilingSprite = new TilingSprite({
        texture: tileTexture,
        width: window.innerWidth,
        height: window.innerHeight,
      });
      tilingSprite.tilePosition.set(grid.squareSize / 2, grid.squareSize / 2);
      pixiApp.stage.addChild(tilingSprite);

      beamRenderTexture = RenderTexture.create({
        width: window.innerWidth,
        height: window.innerHeight,
        dynamic: true,
      });
      // pixiApp.renderer.clear({
      //   target: beamRenderTexture,
      //   clearColor: new Color('black'),
      // });
      beamSprite = new Sprite(beamRenderTexture);
      beamSprite.blendMode = 'add';
      pixiApp.stage.addChild(beamSprite);

      pixiApp.ticker.maxFPS = FPS;

      const fadeGraphics = new Graphics();
      const headGraphics = new Graphics();

      pixiApp.ticker.add((ticker: Ticker) => {
        if (!beamRenderTexture) return;
        const brt = beamRenderTexture;
        const { deltaMS } = ticker;

        fadeGraphics
          .clear()
          .rect(0, 0, window.innerWidth, window.innerHeight)
          .fill({ color: 'black', alpha: BEAM_TAIL_ALPHA });
        pixiApp.renderer.render({
          container: fadeGraphics,
          target: brt,
          clear: false,
        });

        headGraphics.clear();
        let anyActive = false;

        for (const beam of beams) {
          if (beam.spawnDelay > 0) {
            anyActive = true;
            beam.spawnDelay -= deltaMS;
            if (beam.spawnDelay <= 0) {
              beam.spawnDelay = 0;
              beam.active = true;
            }
          }
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
            headGraphics.moveTo(prevPos.x, prevPos.y);
            for (let k = 1; k < beam.path.length; k++) {
              const cornerDist = beam.cumulativeLengths[k];
              if (cornerDist > prevDistance && cornerDist < beam.headDistance) {
                headGraphics.lineTo(beam.path[k].x, beam.path[k].y);
              }
            }
            headGraphics
              .lineTo(pos.x, pos.y)
              .stroke({ width: 1, color: new Color(primaryColor), alpha: 1 });
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

    const handleResize = () => {
      if (!app || !tilingSprite || !beamSprite) return;

      app.renderer.resize(window.innerWidth, window.innerHeight);
      tilingSprite.width = window.innerWidth;
      tilingSprite.height = window.innerHeight;

      setGridDimensions(gridRef);

      beamRenderTexture?.destroy(true);
      beamRenderTexture = RenderTexture.create({
        width: window.innerWidth,
        height: window.innerHeight,
        dynamic: true,
      });
      // app.renderer.clear({
      //   target: beamRenderTexture,
      //   clearColor: new Color('black'),
      // });
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
