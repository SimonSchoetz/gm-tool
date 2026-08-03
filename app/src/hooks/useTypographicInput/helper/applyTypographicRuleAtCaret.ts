import { TYPOGRAPHIC_RULES } from '@/util';

type TypographicSubstitution = {
  value: string;
  caret: number;
};

// `caret` is nullable because `HTMLInputElement.selectionStart` is declared nullable. The single-character-insertion check reproduces the boundary the Lexical editor gets for free: a paste fires `onChange` exactly like a keystroke, and without the check any pasted text ending in a rule's pattern would have its tail silently rewritten.
export const applyTypographicRuleAtCaret = (
  value: string,
  previousValue: string,
  caret: number | null,
): TypographicSubstitution | null => {
  if (caret === null) return null;
  if (value.length !== previousValue.length + 1) return null;

  const textBeforeCaret = value.slice(0, caret);

  for (const rule of TYPOGRAPHIC_RULES) {
    const match = rule.pattern.exec(textBeforeCaret);
    if (!match) continue;

    return {
      value:
        textBeforeCaret.slice(0, match.index) +
        rule.replacement +
        value.slice(caret),
      caret: match.index + rule.replacement.length,
    };
  }

  return null;
};
