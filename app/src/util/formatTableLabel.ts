const labelMap: Record<string, string> = {
  npcs: 'NPC',
  sessions: 'Session',
  adventures: 'Adventure',
};

export const formatTableLabel = (tableName: string): string =>
  labelMap[tableName] ??
  tableName.charAt(0).toUpperCase() + tableName.slice(1, -1);
