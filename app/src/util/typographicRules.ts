// Every `pattern` must be anchored to the end of the string with `$` and must carry neither the `g` nor the `y` flag: consumers match it against the text before the caret, and a `g`-flagged regex makes `RegExp.prototype.exec` stateful across calls through `lastIndex`, producing intermittent misses. Rules are evaluated in array order and the first match wins, so a pattern that can match a suffix another pattern also matches must be listed first.
type TypographicRule = {
  trigger: string;
  pattern: RegExp;
  replacement: string;
};

export const TYPOGRAPHIC_RULES: TypographicRule[] = [
  // The next two rules are not duplicates — the first matches an em dash before `>`, the second a hyphen. `--` collapses to `—` the instant the second hyphen is typed, so a `>` typed after it arrives at text already reading `—>` and no rule matching the literal `-->` could ever see it: the em-dash rule is what makes typing `-->` reach `→`, while the hyphen rule handles a directly typed `->`.
  { trigger: '>', pattern: /\u2014>$/, replacement: '→' },
  { trigger: '>', pattern: /->$/, replacement: '→' },
  { trigger: '-', pattern: /<-$/, replacement: '←' },
  { trigger: '-', pattern: /--$/, replacement: '—' },
];
