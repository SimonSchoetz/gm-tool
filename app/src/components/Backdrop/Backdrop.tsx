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
import { Beam, Grid } from './types';
import './Backdrop.css';

const AMOUNT_BEAMS = 6;
const BEAM_SPEED = 4;
const SIMULATION_TICK_MS = 1000 / 60;
const MAX_TICKS_PER_FRAME = 4;
const BEAM_BOUNDS_PADDING = 4;

const Backdrop = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const beamCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef(0);
  const beamsRef = useRef<Beam[]>([]);
  const gridRef = useRef<Grid>(null);
  const lastTickTimeRef = useRef(0);

  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const beamCanvas = beamCanvasRef.current;
    if (!gridCanvas || !beamCanvas) return;

    const gridCtx = gridCanvas.getContext('2d', { alpha: false });
    const beamCtx = beamCanvas.getContext('2d');
    if (!gridCtx || !beamCtx) return;

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
          updateBeams(beamsRef, gridRef);
        }

        const dirtyRects: ({
          x: number;
          y: number;
          width: number;
          height: number;
        } | null)[] = [];
        for (const beam of beamsRef.current) {
          dirtyRects.push(beam.lastDrawnBounds);
          const newBounds = getBeamBounds(beam, BEAM_BOUNDS_PADDING);
          beam.lastDrawnBounds = newBounds;
          dirtyRects.push(newBounds);
        }

        const activeDirtyRects = dirtyRects.filter(
          (r): r is { x: number; y: number; width: number; height: number } =>
            r !== null,
        );

        if (activeDirtyRects.length > 0) {
          beamCtx.save();
          const clipPath = new Path2D();
          for (const r of activeDirtyRects) {
            beamCtx.clearRect(r.x, r.y, r.width, r.height);
            clipPath.rect(r.x, r.y, r.width, r.height);
          }
          beamCtx.clip(clipPath);
          drawBeams(beamsRef, beamCtx);
          beamCtx.restore();
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const initCanvas = () => {
      setCanvasSize(gridCanvas, gridCtx);
      setCanvasSize(beamCanvas, beamCtx);
      setGridDimensions(gridRef);
      createGridTiles(gridRef, gridCtx);
      initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
    };

    const updateCanvasOnResize = () => {
      setCanvasSize(gridCanvas, gridCtx);
      setCanvasSize(beamCanvas, beamCtx);
      setGridDimensions(gridRef);
      createGridTiles(gridRef, gridCtx);
      beamsRef.current = [];
      initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
      beamCtx.clearRect(0, 0, beamCanvas.width, beamCanvas.height);
    };

    initCanvas();
    window.addEventListener('resize', updateCanvasOnResize);
    startLoop();

    return () => {
      window.removeEventListener('resize', updateCanvasOnResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      <canvas ref={gridCanvasRef} className='backdrop-grid' />
      <canvas ref={beamCanvasRef} className='backdrop-beams' />
    </>
  );
};

export default Backdrop;
