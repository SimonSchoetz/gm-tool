import type { NodeKey } from 'lexical';

// The attribute a drag handle carries to say which block it moves.
export const BLOCK_KEY_ATTRIBUTE = 'data-block-key';

// The key of the block whose drag handle holds `target`, or null when `target` is not inside a drag handle.
export const handleBlockKeyOf = (target: EventTarget | null): NodeKey | null =>
  target instanceof Element
    ? (target
        .closest(`[${BLOCK_KEY_ATTRIBUTE}]`)
        ?.getAttribute(BLOCK_KEY_ATTRIBUTE) ?? null)
    : null;
