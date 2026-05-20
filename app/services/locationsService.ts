import * as locationDb from '@db/location';
import * as imageService from '@services/imageService';
import type { Location, UpdateLocationInput } from '@db/location';
import {
  locationNotFoundError,
  locationLoadError,
  locationCreateError,
  locationUpdateError,
  locationDeleteError,
} from '@domain/locations';

export type UpdateLocationData = UpdateLocationInput & {
  imgFilePath?: string;
};

export const getAllLocations = async (adventureId: string): Promise<Location[]> => {
  try {
    return await locationDb.getAll(adventureId);
  } catch (err) {
    throw locationLoadError(err);
  }
};

export const getLocationById = async (id: string): Promise<Location> => {
  let location: Location | null;
  try {
    location = await locationDb.get(id);
  } catch (err) {
    throw locationLoadError(err);
  }

  if (!location) {
    throw locationNotFoundError(id);
  }

  return location;
};

export const createLocation = async (adventureId: string): Promise<string> => {
  try {
    return await locationDb.create(adventureId);
  } catch (err) {
    throw locationCreateError(err);
  }
};

export const updateLocation = async (
  id: string,
  data: UpdateLocationData,
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

    await locationDb.update(id, dto);
  } catch (err) {
    throw locationUpdateError(id, err);
  }
};

export const removeLocationImage = async (locationId: string): Promise<void> => {
  const location = await getLocationById(locationId);
  if (!location.image_id) return;
  try {
    await imageService.deleteImage(location.image_id);
    await locationDb.update(locationId, { image_id: null });
  } catch (err) {
    throw locationUpdateError(locationId, err);
  }
};

export const deleteLocation = async (
  id: string,
  location: Location | null = null,
): Promise<void> => {
  try {
    const locationToDelete = location ?? (await getLocationById(id));

    if (locationToDelete.image_id) {
      await imageService.deleteImage(locationToDelete.image_id);
    }

    await locationDb.remove(id);
  } catch (err) {
    throw locationDeleteError(id, err);
  }
};
