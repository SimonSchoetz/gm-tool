import { HttpStatusCode } from '@/enums';

export type LoginResponse = {
  message: string;
  status: HttpStatusCode;
};
