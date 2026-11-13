// No write spanning several database calls is atomic through tauri-plugin-sql (app/db/CLAUDE.md — Migrations). A copy writes its new parent row first and the rows it owns after it; when one of those later writes fails, deleting the new parent row lets the foreign keys' cascade remove what was already written, so the user is left with no half-made copy. The later write's error is the one reported: an undo that fails as well cannot be reported more usefully, and leaves the partial copy in place.
export const writeChildrenOrRemoveParent = async (
  writeChildren: () => Promise<void>,
  removeParent: () => Promise<void>,
): Promise<void> => {
  try {
    await writeChildren();
  } catch (err) {
    try {
      await removeParent();
    } catch {
      // Swallowed on purpose: see the comment above.
    }
    throw err;
  }
};
