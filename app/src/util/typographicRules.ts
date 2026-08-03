// Every `pattern` must be anchored to the end of the string with `$` and must carry neither the `g` nor the `y` flag: consumers match it against the text before the caret, and a `g`-flagged regex makes `RegExp.prototype.exec` stateful across calls through `lastIndex`, producing intermittent misses. Rules are evaluated in array order and the first match wins, so a pattern that can match a suffix another pattern also matches must be listed first.
type TypographicRule = {
  trigger: string;
  pattern: RegExp;
  replacement: string;
};

export const TYPOGRAPHIC_RULES: TypographicRule[] = [
  // `--` fires the moment the second hyphen is typed, so a later `>` arrives at text already reading `—>` and no rule matching the literal `-->` could ever see it — this rule is what makes typing `-->` reach `→`.
  { trigger: '>', pattern: /—>$/, replacement: '→' },
  { trigger: '>', pattern: /->$/, replacement: '→' },
  { trigger: '-', pattern: /<-$/, replacement: '←' },
  { trigger: '-', pattern: /--$/, replacement: '—' },
];
