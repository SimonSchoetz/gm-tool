// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SettingsValueMap } from '../schema';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('updateSetting', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stores the value so the next read returns it', async () => {
    const { updateSetting } = await import('../update');
    const { getSetting } = await import('../get');

    await updateSetting('background', { animation_enabled: false });

    expect(await getSetting('background')).toEqual({
      animation_enabled: false,
    });
  });

  it('rejects a value that fails the schema and leaves the stored value unchanged', async () => {
    const { updateSetting } = await import('../update');
    const { getSetting } = await import('../get');

    await expect(
      updateSetting('background', {
        animation_enabled: 'yes',
      } as unknown as SettingsValueMap['background']),
    ).rejects.toThrow();

    expect(await getSetting('background')).toEqual({
      animation_enabled: true,
    });
  });
  it('stores an Add tab type filter so the next read returns it', async () => {
    const { updateSetting } = await import('../update');
    const { getSetting } = await import('../get');

    await updateSetting('encounterAddFilter', {
      entity_types: ['foes', 'npcs'],
    });

    expect(await getSetting('encounterAddFilter')).toEqual({
      entity_types: ['foes', 'npcs'],
    });
  });

  it('rejects an Add tab type filter naming a type that is not a base entity type and stores nothing', async () => {
    const { updateSetting } = await import('../update');
    const { getSetting } = await import('../get');

    await expect(
      updateSetting('encounterAddFilter', {
        entity_types: ['dragons'],
      } as unknown as SettingsValueMap['encounterAddFilter']),
    ).rejects.toThrow();

    expect(await getSetting('encounterAddFilter')).toBeNull();
  });
});
