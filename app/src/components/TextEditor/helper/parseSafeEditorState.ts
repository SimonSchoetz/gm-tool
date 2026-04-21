export const parseSafeEditorState = (value: string): string | null => {
  try {
    const state = JSON.parse(value) as { root?: { children?: unknown[] } };
    if ((state.root?.children?.length ?? 0) === 0) return null;
    return value;
  } catch {
    return null;
  }
};
