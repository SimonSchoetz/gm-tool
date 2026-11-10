export const getIntensityClass = (intensity: 'bright' | 'dim'): string =>
  intensity === 'bright' ? 'light-source-bright' : 'light-source-dim';
