export const sessionKeys = {
  list: (adventureId: string) => ['sessions', adventureId] as const,
  detail: (sessionId: string) => ['session', sessionId] as const,
};
