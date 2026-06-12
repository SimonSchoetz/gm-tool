import { useEffect, useRef } from 'react';
import { rebuildCanvas } from './helper';
import { Grid } from './types';
import './Backdrop.css';

export const Backdrop = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Grid>(null);

  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const paintGrid = () => {
      rebuildCanvas(canvas, ctx, gridRef);
    };

    paintGrid();
    window.addEventListener('resize', paintGrid);

    return () => {
      window.removeEventListener('resize', paintGrid);
    };
  }, []);

  return <canvas ref={gridCanvasRef} className='backdrop-grid' />;
};
