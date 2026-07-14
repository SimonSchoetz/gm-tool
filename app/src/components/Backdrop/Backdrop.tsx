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
import { useSetting } from '@/data-access-layer';
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
const BASE_DELAY_BETWEEN_BEAMS = 10000;
const FPS = 60;
// Render cost scales with resolution squared; a dim background grid does not need full Retina pixel density
const MAX_RESOLUTION = 1.5;

export const Backdrop = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<Grid>(null);
  const { value: backgroundSettings } = useSetting('background');
  const animationEnabled = backgroundSettings?.animation_enabled ?? null;

  useEffect(() => {
    if (animationEnabled === null) return;
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
        spawnBeam(beam, gridRef, Math.random() * BASE_DELAY_BETWEEN_BEAMS);
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
        resolution: Math.min(window.devicePixelRatio, MAX_RESOLUTION),
        autoDensity: true,
        preference: 'webgl',
        // Keeps dual-GPU laptops on the integrated GPU instead of waking the discrete one for a background canvas
        powerPreference: 'low-power',
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

      if (!animationEnabled) {
        // Pixi's ticker re-renders the full stage every frame even when nothing changes — a static grid needs exactly one render
        pixiApp.ticker.stop();
        // Pixi's global system ticker (SchedulerSystem, EventTicker) otherwise keeps a 60Hz rAF alive, which costs constant CPU/IPC in WKWebView even with nothing drawn
        Ticker.system.stop();
        pixiApp.render();
        return;
      }

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
      if (!app || !tilingSprite) return;

      app.renderer.resize(window.innerWidth, window.innerHeight);
      tilingSprite.width = window.innerWidth;
      tilingSprite.height = window.innerHeight;

      setGridDimensions(gridRef);

      if (beamRenderTexture && beamSprite) {
        beamRenderTexture.destroy(true);
        beamRenderTexture = RenderTexture.create({
          width: window.innerWidth,
          height: window.innerHeight,
          dynamic: true,
        });
        beamSprite.texture = beamRenderTexture;
      }

      if (animationEnabled) {
        if (idleTimeoutId !== null) {
          clearTimeout(idleTimeoutId);
          idleTimeoutId = null;
        }
        beams.forEach((b) => {
          b.active = false;
        });
        spawnAllBeams();
      } else {
        // Ticker is stopped in static mode; repaint once after the resize cleared the drawing buffer
        app.render();
      }
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
  }, [animationEnabled]);

  return <div ref={containerRef} className='backdrop-container' />;
};
