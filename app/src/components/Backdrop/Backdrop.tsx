import { useEffect, useRef } from 'react';
import {
  createGridTiles,
  drawBeams,
  getBeamBounds,
  initBeams,
  setCanvasSize,
  setGridDimensions,
  updateBeams,
} from './helper';
import { Beam, Bounds, Grid } from './types';
import './Backdrop.css';

const AMOUNT_BEAMS = 6;
const BEAM_SPEED = 4;
const SIMULATION_TICK_MS = 1000 / 20;
const MAX_TICKS_PER_FRAME = 4;
const BEAM_BOUNDS_PADDING = 4;

const Backdrop = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef(0);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const dprRef = useRef(1);
  const beamsRef = useRef<Beam[]>([]);
  const gridRef = useRef<Grid>(null);
  const lastTickTimeRef = useRef(0);
  const wakeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const startLoop = () => {
      lastTickTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const animate = (now: number) => {
      const elapsed = now - lastTickTimeRef.current;
      const ticks = Math.min(
        Math.floor(elapsed / SIMULATION_TICK_MS),
        MAX_TICKS_PER_FRAME,
      );

      if (ticks > 0) {
        lastTickTimeRef.current += ticks * SIMULATION_TICK_MS;
        for (let t = 0; t < ticks; t++) {
          updateBeams(beamsRef, gridRef, now);
        }

        const dirtyRects: (Bounds | null)[] = [];
        for (const beam of beamsRef.current) {
          dirtyRects.push(beam.lastDrawnBounds);
          const newBounds = getBeamBounds(beam, BEAM_BOUNDS_PADDING);
          beam.lastDrawnBounds = newBounds;
          dirtyRects.push(newBounds);
        }

        const activeDirtyRects = dirtyRects.filter(
          (r): r is Bounds => r !== null,
        );

        if (
          activeDirtyRects.length > 0 &&
          offscreenCanvasRef.current !== null
        ) {
          const offscreen = offscreenCanvasRef.current;
          const dpr = dprRef.current;
          ctx.save();
          const clipPath = new Path2D();
          for (const r of activeDirtyRects) {
            ctx.drawImage(
              offscreen,
              r.x * dpr,
              r.y * dpr,
              r.width * dpr,
              r.height * dpr,
              r.x,
              r.y,
              r.width,
              r.height,
            );
            clipPath.rect(r.x, r.y, r.width, r.height);
          }
          ctx.clip(clipPath);
          drawBeams(beamsRef, ctx);
          ctx.restore();
        }
      }

      const isIdle =
        beamsRef.current.length > 0 &&
        beamsRef.current.every(
          (beam) => !beam.active && beam.particles.length === 0,
        );

      if (isIdle) {
        const nextSpawnTime = Math.min(
          ...beamsRef.current.map((beam) => beam.nextSpawnTime),
        );
        const delay = Math.max(0, nextSpawnTime - performance.now());
        wakeTimeoutRef.current = window.setTimeout(startLoop, delay);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const initCanvas = () => {
      setCanvasSize(canvas, ctx);
      setGridDimensions(gridRef);
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
      offscreenCanvasRef.current = offscreen;
      const offscreenCtx = offscreen.getContext('2d');
      if (offscreenCtx) {
        offscreenCtx.scale(dpr, dpr);
        createGridTiles(gridRef, offscreenCtx);
      }
      ctx.drawImage(
        offscreen,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        window.innerWidth,
        window.innerHeight,
      );
      initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED, performance.now());
    };

    const updateCanvasOnResize = () => {
      if (wakeTimeoutRef.current !== null) {
        clearTimeout(wakeTimeoutRef.current);
        wakeTimeoutRef.current = null;
      }
      cancelAnimationFrame(animationFrameRef.current);
      setCanvasSize(canvas, ctx);
      setGridDimensions(gridRef);
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
      offscreenCanvasRef.current = offscreen;
      const offscreenCtx = offscreen.getContext('2d');
      if (offscreenCtx) {
        offscreenCtx.scale(dpr, dpr);
        createGridTiles(gridRef, offscreenCtx);
      }
      ctx.drawImage(
        offscreen,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        window.innerWidth,
        window.innerHeight,
      );
      beamsRef.current = [];
      initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED, performance.now());
      startLoop();
    };

    initCanvas();
    window.addEventListener('resize', updateCanvasOnResize);
    startLoop();

    return () => {
      window.removeEventListener('resize', updateCanvasOnResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (wakeTimeoutRef.current !== null) {
        clearTimeout(wakeTimeoutRef.current);
      }
    };
  }, []);

  return <canvas ref={gridCanvasRef} className='backdrop-grid' />;
};

export default Backdrop;
