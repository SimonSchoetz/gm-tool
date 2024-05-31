export type TypedFormData<T> = { [K in keyof T]: FormDataEntryValue };
