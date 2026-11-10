export const getLinkPanelIntensity = (
  isLinkInputEnabled: boolean,
): 'bright' | 'dim' => (isLinkInputEnabled ? 'bright' : 'dim');
