import {
  Application,
  Color,
  Graphics,
  RenderTexture,
  Sprite,
  TilingSprite,
} from 'pixi.js';
import { useEffect, useRef } from 'react';
import {
  buildCompositeColor,
  createGridTileTexture,
  getColor,
  setGridDimensions,
  spawnBeam,
  tickBeams,
} from './helper';
import type { Beam, Grid } from './types';
import './Backdrop.css';

const AMOUNT_BEAMS = 5;
const BEAM_TAIL_ALPHA = 0.08;
const IDLE_RESPAWN_DELAY_MS = 1000;
const BASE_DELEAY_BETWEEN_BEAMS = 10000;
const FPS = 60;

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
      speed: 0,
      active: false,
      spawnDelay: 0,
    }));

    const spawnAllBeams = () => {
      beams.forEach((beam) => {
        spawnBeam(beam, gridRef, Math.random() * BASE_DELEAY_BETWEEN_BEAMS);
      });
      app?.ticker.start();
    };

    const init = async () => {
      const primaryColor = getColor('--color-primary');
      const bgCompositeColor = buildCompositeColor(); // black when we implement high contrast with no grid

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

      beamSprite = new Sprite(beamRenderTexture);
      beamSprite.blendMode = 'add';
      pixiApp.stage.addChild(beamSprite);

      pixiApp.ticker.maxFPS = FPS;

      const fadeGraphics = new Graphics();
      const headGraphics = new Graphics();

      pixiApp.ticker.add((ticker) => {
        if (!beamRenderTexture) return;
        tickBeams({
          beams,
          beamRenderTexture,
          primaryColor,
          app: pixiApp,
          headGraphics,
          fadeGraphics,
          deltaMS: ticker.deltaMS,
          beamTailAlpha: BEAM_TAIL_ALPHA,
          onIdle: () => {
            pixiApp.ticker.stop();
            idleTimeoutId = setTimeout(spawnAllBeams, IDLE_RESPAWN_DELAY_MS);
          },
        });
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
