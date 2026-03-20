export type MentionSearchError = Error & { name: 'MentionSearchError' };
export const mentionSearchError = (cause?: unknown): MentionSearchError => {
  const error = new Error(`Failed to search mentions: ${cause}`) as MentionSearchError;
  error.name = 'MentionSearchError';
  return error;
};
