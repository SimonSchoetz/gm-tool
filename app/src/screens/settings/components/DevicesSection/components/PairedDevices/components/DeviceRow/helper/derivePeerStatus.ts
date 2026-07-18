export type PeerStatus = 'connected' | 'incompatible' | 'disconnected';

export const derivePeerStatus = (
  isConnected: boolean,
  compat: 'compatible' | 'incompatible' | null,
): PeerStatus => {
  if (!isConnected) return 'disconnected';
  if (compat === 'compatible') return 'connected';
  if (compat === 'incompatible') return 'incompatible';
  return 'disconnected';
};
