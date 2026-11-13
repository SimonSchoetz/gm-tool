import { generateId } from '../util';

// The id an image will get, generated before it is created so the caller can record it first.
export const generateImageId = (): string => generateId();
