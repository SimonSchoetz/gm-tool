import { useEffect, useRef } from 'react';
import {
  createBeams,
  createGridTiles,
  initBeams,
  setCanvasSize,
  setGridDimensions,
} from './helper';
import { Beam, Grid } from './types';

const AMOUNT_BEAMS = 3;
const BEAM_SPEED = 4;

const Backdrop = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const beamsRef = useRef<Beam[]>([]);
  const gridRef = useRef<Grid>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const animate = () => {
      createGridTiles(gridRef, ctx);
      createBeams(beamsRef, ctx, gridRef);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const initCanvas = () => {
      setCanvasSize(canvas, ctx);
      setGridDimensions(gridRef);
      initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
    };

    const updateCanvasOnResize = () => {
      setCanvasSize(canvas, ctx);
      setGridDimensions(gridRef);
      beamsRef.current = [];
      initBeams(beamsRef, AMOUNT_BEAMS, BEAM_SPEED);
    };

    initCanvas();
    window.addEventListener('resize', updateCanvasOnResize);
    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasOnResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -10,
        transition: 'opacity 0.1s ease-in-out',
      }}
    />
  );
};

export default Backdrop;
