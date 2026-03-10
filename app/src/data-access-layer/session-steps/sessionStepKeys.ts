export const sessionStepKeys = {
  list: (sessionId: string) => ['session-steps', sessionId] as const,
};
