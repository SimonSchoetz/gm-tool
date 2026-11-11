import { useLayoutEffect, useRef } from 'react';
import { applyTypographicRuleAtCaret } from './helper/applyTypographicRuleAtCaret';

type TypographicInput = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

// Gives a controlled text input the typographic rule table's behavior. Pass the input's current controlled `value`, spread the returned `inputRef` onto the input as its `ref` and wire `handleChange` as its `onChange`; `onValueChange` receives the substituted value when a rule fired and the raw value otherwise. Each keystroke is judged against `value`, so text the field held before the first keystroke, or adopted from outside, counts as what was there before it.
export const useTypographicInput = (
  value: string,
  onValueChange: (value: string) => void,
): TypographicInput => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const substitution = applyTypographicRuleAtCaret(
      rawValue,
      value,
      event.target.selectionStart,
    );
    const nextValue = substitution ? substitution.value : rawValue;

    if (substitution) pendingCaretRef.current = substitution.caret;

    onValueChange(nextValue);
  };

  // Must run before paint: a substitution replaces two typed characters with one glyph, so the browser leaves the caret one offset too far right, and a passive effect would let that wrong caret position be painted for a frame before correcting it.
  useLayoutEffect(() => {
    const caret = pendingCaretRef.current;
    const input = inputRef.current;
    if (caret === null || !input) return;

    pendingCaretRef.current = null;
    input.setSelectionRange(caret, caret);
  });

  return { inputRef, handleChange };
};
