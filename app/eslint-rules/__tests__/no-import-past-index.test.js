// @ts-check
import { describe, it, expect } from 'vitest';
import { findCrossedBoundary, isBoundaryDir } from '../no-import-past-index.js';

/** @param {string[]} dirs */
const boundariesAt = (dirs) => {
  const boundaries = new Set(dirs);
  /** @param {string} dir */
  return (dir) => boundaries.has(dir);
};

describe('findCrossedBoundary', () => {
  it('returns null when the importer is inside the boundary folder', () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/components/Header/Header.tsx',
        targetPath: '/app/src/components/Header/helper/buildBreadcrumbs.ts',
        isBoundary: boundariesAt(['/app/src/components/Header']),
        passThroughDirs: [],
      }),
    ).toBeNull();
  });

  it("returns null when the target is the boundary's own index.ts", () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/screens/session/SessionScreen.tsx',
        targetPath: '/app/src/components/Header/index.ts',
        isBoundary: boundariesAt(['/app/src/components/Header']),
        passThroughDirs: [],
      }),
    ).toBeNull();
  });

  it('returns the boundary when the target is a non-index file behind it', () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/screens/session/SessionScreen.tsx',
        targetPath: '/app/src/components/Header/helper/buildBreadcrumbs.ts',
        isBoundary: boundariesAt(['/app/src/components/Header']),
        passThroughDirs: [],
      }),
    ).toBe('/app/src/components/Header');
  });

  it("returns the outermost crossed boundary when the target is a nested module's index.ts", () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/screens/session/SessionScreen.tsx',
        targetPath: '/app/src/data-access-layer/sessions/index.ts',
        isBoundary: boundariesAt([
          '/app/src/data-access-layer',
          '/app/src/data-access-layer/sessions',
        ]),
        passThroughDirs: [],
      }),
    ).toBe('/app/src/data-access-layer');
  });

  it('skips a pass-through folder but enforces the boundaries nested inside it', () => {
    const isBoundary = boundariesAt([
      '/app/domain',
      '/app/domain/sessions',
      '/app/domain/devices',
    ]);
    const passThroughDirs = ['/app/domain'];

    expect(
      findCrossedBoundary({
        importerPath: '/app/services/sessionService.ts',
        targetPath: '/app/domain/sessions/index.ts',
        isBoundary,
        passThroughDirs,
      }),
    ).toBeNull();
    expect(
      findCrossedBoundary({
        importerPath: '/app/domain/sync/messages.ts',
        targetPath: '/app/domain/devices/messages.ts',
        isBoundary,
        passThroughDirs,
      }),
    ).toBe('/app/domain/devices');
  });

  it('treats a folder without an index.ts as no boundary', () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/screens/session/SessionScreen.tsx',
        targetPath: '/app/src/components/GlassPanel/GlassPanel.tsx',
        isBoundary: boundariesAt([]),
        passThroughDirs: [],
      }),
    ).toBeNull();
  });
});

describe('isBoundaryDir', () => {
  it('isBoundaryDir recognizes index.ts but not index.tsx', () => {
    const files = new Set([
      '/app/src/routes/index.tsx',
      '/app/src/components/Header/index.ts',
    ]);
    /** @param {string} filePath */
    const fileExists = (filePath) => files.has(filePath);

    expect(isBoundaryDir('/app/src/routes', fileExists)).toBe(false);
    expect(isBoundaryDir('/app/src/components/Header', fileExists)).toBe(true);
  });
});
