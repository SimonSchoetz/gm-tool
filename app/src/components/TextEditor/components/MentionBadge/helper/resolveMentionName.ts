// The name stored in the mention is shown until the entity's live name has loaded, and again when the entity has no name.
export const resolveMentionName = (
  loading: boolean,
  liveName: string | null,
  displayName: string,
): string => (!loading && liveName !== null ? liveName : displayName);
