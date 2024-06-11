export type FormSubmitResponse =
  | { message: string }
  | { error: string | Record<string, string> };
