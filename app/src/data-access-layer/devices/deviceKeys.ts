export const deviceKeys = {
  own: () => ['device-own'] as const,
  paired: () => ['devices-paired'] as const,
  connected: () => ['devices-connected'] as const,
  init: () => ['devices-connectivity-init'] as const,
  syncCompat: () => ['devices-sync-compat'] as const,
};
