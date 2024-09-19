import { EmailSender } from '@/enums';
import { ReactNode } from 'react';

export type EmailData = {
  from: EmailSender;
  to: string;
  subject: string;
  template: ReactNode;
};
