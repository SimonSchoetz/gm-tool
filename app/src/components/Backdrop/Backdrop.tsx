import { useEffect, useRef } from 'react';
import {
  createGridTiles,
  drawBeams,
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
        drawBeams(beamsRef, beamCtx);
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
