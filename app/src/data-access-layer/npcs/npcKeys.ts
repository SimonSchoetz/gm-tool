export const npcKeys = {
  list: (adventureId: string) => ['npcs', adventureId] as const,
  detail: (npcId: string) => ['npc', npcId] as const,
};
