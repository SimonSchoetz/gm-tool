import { z } from 'zod';

const NUMBER_KEYS = [
  'hp',
  'ac',
  'initiative',
  'proficiencyBonus',
  'strMod',
  'strSave',
  'dexMod',
  'dexSave',
  'conMod',
  'conSave',
  'intMod',
  'intSave',
  'wisMod',
  'wisSave',
  'chaMod',
  'chaSave',
] as const;
const TEXT_KEYS = [
  'speed',
  'creatureType',
  'resistances',
  'immunities',
  'senses',
  'skills',
  'languages',
] as const;

export type FiveEStatBlockNumberKey = (typeof NUMBER_KEYS)[number];
export type FiveEStatBlockTextKey = (typeof TEXT_KEYS)[number];
export type FiveEStatBlockContent = {
  fiveEStatBlock: Record<FiveEStatBlockNumberKey, number | null> &
    Record<FiveEStatBlockTextKey, string>;
};

const numberShape = Object.fromEntries(
  NUMBER_KEYS.map((key) => [key, z.int().nullable()]),
) as Record<FiveEStatBlockNumberKey, z.ZodNullable<z.ZodInt>>;
const textShape = Object.fromEntries(
  TEXT_KEYS.map((key) => [key, z.string()]),
) as Record<FiveEStatBlockTextKey, z.ZodString>;

export const fiveEStatBlockContentSchema: z.ZodType<FiveEStatBlockContent> =
  z.object({
    fiveEStatBlock: z.object({ ...numberShape, ...textShape }),
  });

const EMPTY_CONTENT: FiveEStatBlockContent = {
  fiveEStatBlock: {
    ...(Object.fromEntries(NUMBER_KEYS.map((key) => [key, null])) as Record<
      FiveEStatBlockNumberKey,
      null
    >),
    ...(Object.fromEntries(TEXT_KEYS.map((key) => [key, ''])) as Record<
      FiveEStatBlockTextKey,
      string
    >),
  },
};

// Total on purpose: a section created as plain text or from the Lexical editor holds content in another shape, and shows as empty until its first edit replaces it.
export const readFiveEStatBlockContent = (
  content: string | null,
): FiveEStatBlockContent => {
  let parsed: unknown;
  // A failed parse and a skipped parse both leave nothing the schema accepts, so either way the content reads empty.
  try {
    // `String(null)` is `'null'`, which parses to a value the schema rejects, so null content reads empty without a branch of its own.
    parsed = JSON.parse(String(content));
  } catch {
    return EMPTY_CONTENT;
  }
  const result = fiveEStatBlockContentSchema.safeParse(parsed);
  return result.success ? result.data : EMPTY_CONTENT;
};

export const patchFiveEStatBlockContent = <
  K extends FiveEStatBlockNumberKey | FiveEStatBlockTextKey,
>(
  content: string | null,
  key: K,
  value: FiveEStatBlockContent['fiveEStatBlock'][K],
): string => {
  const current = readFiveEStatBlockContent(content);
  const patched: FiveEStatBlockContent = {
    fiveEStatBlock: { ...current.fiveEStatBlock, [key]: value },
  };
  return JSON.stringify(patched);
};
