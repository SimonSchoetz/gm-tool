import {
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  type Transformer,
} from '@lexical/markdown';
import { TYPOGRAPHIC_TRANSFORMERS } from '../typographicTransformers';

export const getMarkdownTransformers = (isDocument: boolean): Transformer[] =>
  isDocument
    ? [UNORDERED_LIST, ORDERED_LIST, CHECK_LIST, ...TYPOGRAPHIC_TRANSFORMERS]
    : TYPOGRAPHIC_TRANSFORMERS;
