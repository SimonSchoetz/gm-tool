import { useLayoutEffect, useRef } from 'react';
import { applyTypographicRuleAtCaret } from './helper';

type TypographicInput = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

// Gives a controlled text input the typographic rule table's behavior. Spread the returned `inputRef` onto the input as its `ref` and wire `handleChange` as its `onChange`; `onValueChange` receives the substituted value when a rule fired and the raw value otherwise.
export const useTypographicInput = (
  onValueChange: (value: string) => void,
): TypographicInput => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousValueRef = useRef('');
  const pendingCaretRef = useRef<number | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const substitution = applyTypographicRuleAtCaret(
      rawValue,
      previousValueRef.current,
      event.target.selectionStart,
    );
    const nextValue = substitution ? substitution.value : rawValue;

    previousValueRef.current = nextValue;
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
