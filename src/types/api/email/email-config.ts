import { EmailSender } from '@/enums';
import { ReactNode } from 'react';

export type EmailConfig = {
  from: EmailSender;
  to: string;
  subject: string;
  template: ReactNode;
};
