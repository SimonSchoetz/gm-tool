import type { TextFormatType } from 'lexical';

export const buildMentionTextDecoration = (
  formats: readonly TextFormatType[],
): string => {
  const tokens: string[] = [];
  if (formats.includes('underline')) tokens.push('underline');
  if (formats.includes('strikethrough')) tokens.push('line-through');
  return tokens.length > 0 ? tokens.join(' ') : 'none';
};
