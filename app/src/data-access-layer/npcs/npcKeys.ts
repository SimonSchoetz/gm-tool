// Query key factory — single source of truth for all NPC cache keys
export const npcKeys = {
  list: (adventureId: string) => ['npcs', adventureId] as const,
  detail: (npcId: string) => ['npc', npcId] as const,
};
