/**
 * should accept any object
 * should accept nested objects and go deep into them
 * should return true if the object is empty
 * empty means: values are empty strings
 */

export const formObjectIsEmpty = (obj: object): boolean => {
  return Object.values(obj).every((value) => {
    if (typeof value === 'object') {
      return formObjectIsEmpty(value);
    }
    return value === '';
  });
};
