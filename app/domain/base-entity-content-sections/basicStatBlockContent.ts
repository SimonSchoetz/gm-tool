import { z } from 'zod';

export const BASIC_STAT_BLOCK_HP_LABEL = 'HP';

const hpSchema = z.int().nullable();

export const basicStatBlockContentSchema = z.object({
  basicStatBlock: z.object({ hp: hpSchema }),
  // Lexical editor state exactly as TextEditor emits it: its shape is Lexical's, so it is validated only as a string, and kept a string because ExternalValueSyncPlugin compares it byte for byte with the editor's own output.
  textEditor: z.string(),
});

type BasicStatBlockContent = z.infer<typeof basicStatBlockContentSchema>;

type BasicStatBlockHpInput =
  { valid: true; hp: number | null } | { valid: false };

// Lets the SyntaxError or ZodError propagate instead of using an error factory: every write is validated, so stored content failing the schema is a should-never-happen invariant.
export const parseBasicStatBlockContent = (
  content: string | null,
): BasicStatBlockContent => {
  if (content === null) {
    return { basicStatBlock: { hp: null }, textEditor: '' };
  }
  const parsed: unknown = JSON.parse(content);
  return basicStatBlockContentSchema.parse(parsed);
};

export const patchBasicStatBlockContent = (
  content: string | null,
  patch: { hp: number | null } | { textEditor: string },
): string => {
  const current = parseBasicStatBlockContent(content);
  const patched: BasicStatBlockContent =
    'hp' in patch
      ? {
          ...current,
          basicStatBlock: { ...current.basicStatBlock, hp: patch.hp },
        }
      : { ...current, textEditor: patch.textEditor };
  return JSON.stringify(patched);
};

export const parseBasicStatBlockHpInput = (
  raw: string,
): BasicStatBlockHpInput => {
  if (raw.trim() === '') {
    return { valid: true, hp: null };
  }
  const result = hpSchema.safeParse(Number(raw));
  return result.success ? { valid: true, hp: result.data } : { valid: false };
};
