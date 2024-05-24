import { NewAdventureRequestData } from '@/types';
import { assertIsString } from '@/util';
import { mapFormDataToObject } from '@/util/mapper';
import { assertIsNewAdventureRequestData } from './assert-is-new-adventure-request-data';

export const mapToCreateAdventureRequestData = (
  data: FormData
): NewAdventureRequestData => {
  const mappedFormData = mapFormDataToObject<NewAdventureRequestData>(data);

  const mappedRequestData: Partial<NewAdventureRequestData> = {};

  Object.keys(mappedFormData).forEach((key): void => {
    const typedKey = key as keyof NewAdventureRequestData;

    const value = mappedFormData[typedKey];
    assertIsString(value);

    if (value.length > 0) {
      mappedRequestData[typedKey] = value;
    }
  });

  assertIsNewAdventureRequestData(mappedRequestData);
  return mappedRequestData;
};
