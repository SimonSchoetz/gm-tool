import { useEffect, useRef } from 'react';
import {
  createBeams,
  createGridTiles,
  initBeams,
  setCanvasSize,
  setGridDimensions,
} from './helper';
import { Beam, Grid } from './types';
import './Backdrop.css';

const AMOUNT_BEAMS = 6;
const BEAM_SPEED = 4;

const Backdrop = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const beamCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef(0);
  const beamsRef = useRef<Beam[]>([]);
  const gridRef = useRef<Grid>(null);

  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const beamCanvas = beamCanvasRef.current;
    if (!gridCanvas || !beamCanvas) return;

    const gridCtx = gridCanvas.getContext('2d', { alpha: false });
    const beamCtx = beamCanvas.getContext('2d');
    if (!gridCtx || !beamCtx) return;

    const animate = () => {
      createBeams(beamsRef, beamCtx, gridRef);
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
    animate();

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
