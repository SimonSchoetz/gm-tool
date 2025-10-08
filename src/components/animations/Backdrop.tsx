'use client';

import { useEffect, useRef, useState } from 'react';

type Beam = {
  path: { x: number; y: number }[];
  currentIndex: number;
  particles: Particle[];
  color: string;
  nextSpawnTime: number;
  progress: number; // 0 to 1, tracks position along path
  speed: number; // pixels per frame
  active: boolean;
};

type Particle = {
  x: number;
  y: number;
  age: number;
  maxAge: number;
};

const Backdrop = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const animationFrameRef = useRef<number>(0);
  const beamsRef = useRef<Beam[]>([]);
  const gridRef = useRef<{
    squareSize: number;
    cols: number;
    rows: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // config
  const numBeams = 3;
  const beamSpeed = 4;

  useEffect(() => {
    setFadeIn(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Get colors from CSS custom properties
    const getColor = (varName: string): string => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
    };

    const colors = [
      getColor('--gm-primary'),
      getColor('--gm-primary-20'),
      getColor('--gm-primary-30'),
      getColor('--gm-primary-50'),
    ];

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      // grid dimentions
      const maxSquareSize = 120;
      const squareSize = Math.min(window.innerWidth / 8, maxSquareSize);

      const cols = window.innerWidth / squareSize + 1;
      const rows = window.innerHeight / squareSize + 1;

      const offset = -squareSize / 2;

      const offsetX = offset;

      const offsetY = offset;

      gridRef.current = { squareSize, cols, rows, offsetX, offsetY };

      // Reset beams on resize
      beamsRef.current = [];
      initializeBeams();
    };

    const drawGrid = () => {
      if (!gridRef.current) return;
      const { squareSize, cols, rows, offsetX, offsetY } = gridRef.current;

      // Background
      ctx.fillStyle = getColor('--gm-primary-10');
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw grid squares
      const bgColor = getColor('--gm-bg');
      const bg50Color = getColor('--gm-bg-50');

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * squareSize;
          const y = offsetY + row * squareSize;

          // Outer square
          ctx.fillStyle = bg50Color;
          ctx.fillRect(x, y, squareSize - 0.5, squareSize - 0.5);

          // Inner 2x2 grid
          const innerSize = (squareSize - 1) / 2;
          ctx.fillStyle = bgColor;

          for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
              ctx.fillRect(
                x + j * innerSize + (j > 0 ? 1 : 0),
                y + i * innerSize + (i > 0 ? 1 : 0),
                innerSize - (j > 0 ? 1 : 0),
                innerSize - (i > 0 ? 1 : 0)
              );
            }
          }
        }
      }
    };

    const generateZigzagPath = (): { x: number; y: number }[] => {
      if (!gridRef.current) return [];
      const { squareSize, cols, rows, offsetX, offsetY } = gridRef.current;

      const path: { x: number; y: number }[] = [];
      let currentCol = Math.floor(Math.random() * cols);
      let currentRow = 0;
      const startSide = Math.random() < 0.5 ? 'left' : 'right';
      const offset = startSide === 'left' ? 0 : squareSize;

      // Starting position
      path.push({
        x: offsetX + currentCol * squareSize + offset,
        y: offsetY + currentRow * squareSize,
      });

      while (currentRow <= rows) {
        const shouldMoveHorizontally = Math.random() < 0.4;

        if (shouldMoveHorizontally) {
          // Move left or right
          const direction = Math.random() < 0.5 ? -1 : 1;
          const newCol = Math.max(
            0,
            Math.min(cols - 1, currentCol + direction)
          );

          if (newCol !== currentCol) {
            currentCol = newCol;
            path.push({
              x: offsetX + currentCol * squareSize + offset,
              y: offsetY + currentRow * squareSize,
            });
          }
        }

        // Always move down after horizontal movement (or if no horizontal movement)
        currentRow++;
        if (currentRow <= rows) {
          path.push({
            x: offsetX + currentCol * squareSize + offset,
            y: offsetY + currentRow * squareSize,
          });
        }
      }

      return path;
    };

    const initializeBeams = () => {
      for (let i = 0; i < numBeams; i++) {
        beamsRef.current.push({
          path: [],
          currentIndex: 0,
          particles: [],
          color: colors[Math.floor(Math.random() * colors.length)],
          nextSpawnTime: Date.now() + Math.random() * 10000 + i * 2000,
          progress: 0,
          speed: beamSpeed + i * 0.5,
          active: false,
        });
      }
    };

    const getPositionOnPath = (
      path: { x: number; y: number }[],
      distance: number
    ): { x: number; y: number } | null => {
      if (path.length < 2) return null;

      let accumulated = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        if (accumulated + segmentLength >= distance) {
          const t = (distance - accumulated) / segmentLength;
          return {
            x: path[i].x + dx * t,
            y: path[i].y + dy * t,
          };
        }
        accumulated += segmentLength;
      }

      return path[path.length - 1];
    };

    const getPathLength = (path: { x: number; y: number }[]): number => {
      let length = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        length += Math.sqrt(dx * dx + dy * dy);
      }
      return length;
    };

    const updateBeams = () => {
      const now = Date.now();

      beamsRef.current.forEach((beam) => {
        // Start new beam if it's time
        if (now > beam.nextSpawnTime && !beam.active) {
          beam.path = generateZigzagPath();
          beam.progress = 0;
          beam.active = true;
          beam.color = colors[Math.floor(Math.random() * colors.length)];
          beam.particles = [];
        }

        // Update active beam
        if (beam.active && beam.path.length > 0) {
          const pathLength = getPathLength(beam.path);
          const currentPosition = getPositionOnPath(beam.path, beam.progress);

          if (currentPosition) {
            // Spawn new particle at current position
            beam.particles.push({
              x: currentPosition.x,
              y: currentPosition.y,
              age: 0,
              maxAge: beam.speed * 5,
            });
          }

          beam.progress += beam.speed;

          // Check if beam completed
          if (beam.progress >= pathLength) {
            beam.active = false;
            beam.nextSpawnTime = now + Math.random() * 10000 + 5000;
          }
        }

        // Update and remove old particles
        beam.particles = beam.particles
          .map((particle) => ({
            ...particle,
            age: particle.age + 1,
          }))
          .filter((particle) => particle.age < particle.maxAge);
      });
    };

    const hexToRgba = (hex: string, alpha: number): string => {
      // Remove # if present
      hex = hex.replace('#', '');

      // Handle 8-digit hex (with alpha)
      if (hex.length === 8) {
        hex = hex.slice(0, 6);
      }

      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const drawBeams = () => {
      beamsRef.current.forEach((beam) => {
        if (beam.particles.length === 0) return;

        // Draw line segments connecting particles for smooth trail
        ctx.shadowBlur = 0;
        ctx.shadowColor = beam.color;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'bevel';

        // Draw from oldest to newest for proper layering
        for (let i = beam.particles.length - 1; i >= 0; i--) {
          const particle = beam.particles[i];
          const opacity = Math.max(0, 1 - particle.age / particle.maxAge);
          const width = 1;

          ctx.strokeStyle = hexToRgba(beam.color, opacity);
          ctx.lineWidth = width;

          if (i > 0) {
            const prevParticle = beam.particles[i - 1];
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(prevParticle.x, prevParticle.y);
            ctx.stroke();
          }

          //Draw a bright dot at the head
          if (i === beam.particles.length - 1) {
            ctx.fillStyle = hexToRgba(beam.color, 1);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, width * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Reset shadow and line properties
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
    };

    const animate = () => {
      drawGrid();
      updateBeams();
      drawBeams();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
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
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.1s ease-in-out',
      }}
    />
  );
};

export default Backdrop;
