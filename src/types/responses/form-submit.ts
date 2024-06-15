import { HttpStatusCode } from '@/enums';

export type FormSubmitResponse = {
  status: HttpStatusCode;
  error?: Record<string, string>;
};
