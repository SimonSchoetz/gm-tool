export const IMAGE_FILE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
] as const;

type ImageFileExtension = (typeof IMAGE_FILE_EXTENSIONS)[number];

export const isImageFileExtension = (
  value: string,
): value is ImageFileExtension =>
  IMAGE_FILE_EXTENSIONS.some((extension) => extension === value);
