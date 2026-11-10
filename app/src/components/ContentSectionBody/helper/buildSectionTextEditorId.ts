// The id includes the section id and the mode, so switching sections or modes remounts TextEditor (it keys on textEditorId) instead of keeping the previous content.
export const buildSectionTextEditorId = (
  prefix: string,
  sectionId: string,
  readOnly: boolean,
): string => `${prefix}-${sectionId}-${readOnly ? 'read' : 'edit'}`;
