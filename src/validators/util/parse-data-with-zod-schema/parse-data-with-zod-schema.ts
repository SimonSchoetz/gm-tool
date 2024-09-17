import { assertIsFormData } from '@/util/asserts';
import { mapFormDataToDto } from '@/util/mapper';
import { isFormData } from '@/util/type-guards';
import { ValidatorName, getValidator } from '../get-validator/get-validator';

export const parseDataWithZodValidator = <T>(
  data: unknown,
  schemaName: ValidatorName
): T => {
  const schema = getValidator(schemaName);

  if (isFormData(data)) {
    assertIsFormData(data);
    const mappedData = mapFormDataToDto(data);
    return schema.parse(mappedData) as T;
  }

  return schema.parse(data) as T;
};
