# SF3: Service Layer

Create `services/foesService.ts`. Depends on SF1 (`@db/foe`) and SF2 (`@domain/foes`).

## Files Affected

```
New:
  app/services/foesService.ts
```

## Services Layer

### `app/services/foesService.ts`

```ts
import * as foeDb from '@db/foe';
import * as imageService from '@services/imageService';
import type { Foe, UpdateFoeInput } from '@db/foe';
import {
  foeNotFoundError,
  foeLoadError,
  foeCreateError,
  foeUpdateError,
  foeDeleteError,
} from '@domain/foes';

export type UpdateFoeData = UpdateFoeInput & {
  imgFilePath?: string;
};

export const getAllFoes = async (adventureId: string): Promise<Foe[]> => {
  try {
    return await foeDb.getAll(adventureId);
  } catch (err) {
    throw foeLoadError(err);
  }
};

export const getFoeById = async (id: string): Promise<Foe> => {
  const foe = await foeDb.get(id);

  if (!foe) {
    throw foeNotFoundError(id);
  }

  return foe;
};

export const createFoe = async (adventureId: string): Promise<string> => {
  try {
    return await foeDb.create(adventureId);
  } catch (err) {
    throw foeCreateError(err);
  }
};

export const updateFoe = async (
  id: string,
  data: UpdateFoeData,
): Promise<void> => {
  try {
    let imageId: string | null = null;

    if (data.imgFilePath && data.image_id) {
      imageId = await imageService.replaceImage(
        data.image_id,
        data.imgFilePath,
      );
    }

    if (data.imgFilePath && !data.image_id) {
      imageId = await imageService.createImage(data.imgFilePath);
    }

    const { imgFilePath: _imgFilePath, ...dto } = data;
    if (imageId) {
      dto.image_id = imageId;
    }

    await foeDb.update(id, dto);
  } catch (err) {
    throw foeUpdateError(id, err);
  }
};

export const removeFoeImage = async (foeId: string): Promise<void> => {
  const foe = await getFoeById(foeId);
  if (!foe.image_id) return;
  try {
    await imageService.deleteImage(foe.image_id);
    await foeDb.update(foeId, { image_id: null });
  } catch (err) {
    throw foeUpdateError(foeId, err);
  }
};

export const deleteFoe = async (
  id: string,
  foe: Foe | null = null,
): Promise<void> => {
  try {
    const foeToDelete = foe ?? (await getFoeById(id));

    if (foeToDelete.image_id) {
      await imageService.deleteImage(foeToDelete.image_id);
    }

    await foeDb.remove(id);
  } catch (err) {
    throw foeDeleteError(id, err);
  }
};
```
