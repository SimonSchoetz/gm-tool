type TitledImage = { id: string; title: string };

export const buildTitledImage = (
  imageId: string | null,
  name: string | null,
): TitledImage | null =>
  imageId === null ? null : { id: imageId, title: name ?? '' };
