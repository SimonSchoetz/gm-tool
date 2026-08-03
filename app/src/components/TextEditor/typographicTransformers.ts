import { TextMatchTransformer } from '@lexical/markdown';
import { TYPOGRAPHIC_RULES } from '@/util';

export const TYPOGRAPHIC_TRANSFORMERS: TextMatchTransformer[] =
  TYPOGRAPHIC_RULES.map((rule) => ({
    type: 'text-match',
    dependencies: [],
    trigger: rule.trigger,
    regExp: rule.pattern,
    // The node arrives already split to exactly the matched range, so mutating it in place preserves its identity and therefore its format bits — a `->` typed inside bold text yields a bold arrow, which creating a replacement TextNode would lose.
    replace: (node) => {
      node.setTextContent(rule.replacement);
    },
  }));
