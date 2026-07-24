export type MentionSearchError = Error & { name: 'MentionSearchError' };
export const mentionSearchError = (cause?: unknown): MentionSearchError => {
  const error = new Error(
    `Failed to search mentions: ${String(cause)}`,
  ) as MentionSearchError;
  error.name = 'MentionSearchError';
  return error;
};

export type MentionEntityTypeError = Error & { name: 'MentionEntityTypeError' };
export const mentionEntityTypeError = (
  entityType: string,
): MentionEntityTypeError => {
  const error = new Error(
    `Unknown mention entity type: "${entityType}"`,
  ) as MentionEntityTypeError;
  error.name = 'MentionEntityTypeError';
  return error;
};
