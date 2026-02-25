export const sessionKeys = {
  list: () => ['sessions'] as const,
  detail: (sessionId: string) => ['session', sessionId] as const,
};
