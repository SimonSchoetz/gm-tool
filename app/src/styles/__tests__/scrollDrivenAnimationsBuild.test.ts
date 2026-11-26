// @vitest-environment node
import { resolve } from 'node:path';
import { build, type Rolldown } from 'vite';
import { describe, expect, it } from 'vitest';
import viteConfig from '../../../vite.config.ts';

const GLOBAL_STYLESHEET = resolve(import.meta.dirname, '../index.css');

// The CSS minifier of the production build, never the dev server's unminified CSS, is what the Tauri app runs.
const buildGlobalStylesheet = async (): Promise<string> => {
  const appConfig = await viteConfig({
    command: 'build',
    mode: 'production',
  });
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    root: resolve(import.meta.dirname, '../../..'),
    build: {
      ...appConfig.build,
      write: false,
      rolldownOptions: { input: GLOBAL_STYLESHEET },
    },
  });
  const outputs = (
    Array.isArray(result) ? result : [result]
  ) as Rolldown.RolldownOutput[];
  return outputs
    .flatMap((output) => output.output)
    .filter(
      (chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css'),
    )
    .map((asset) => String((asset as Rolldown.OutputAsset).source))
    .join('');
};

const declarationBlocks = (css: string): string[] =>
  css.split(/[{}]/).filter((block) => block.includes(':'));

describe('scroll-driven animations in the production build', () => {
  it('keep a duration other than 0s, which would hold their last keyframe at every scroll position', async () => {
    const css = await buildGlobalStylesheet();

    const scrollDrivenBlocks = declarationBlocks(css).filter((block) =>
      /(^|;)animation-timeline:/.test(block),
    );

    expect(scrollDrivenBlocks).not.toHaveLength(0);
    for (const block of scrollDrivenBlocks) {
      expect(block).not.toMatch(/animation-duration:[^;]*\b0s/);
    }
  }, 60_000);
});
