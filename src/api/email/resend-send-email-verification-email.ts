'server-only';

import { VerifyEmailTemplate } from '@/components/emails/templates';
import { EmailSender } from '@/enums';
import { sendEmail } from './resend-send-email';
import { EmailConfig, EmailResponse } from '@/types/api/email';

export const resendSendEmailVerificationEmail = async (
  token: string,
  userEmail: string
): Promise<EmailResponse> => {
  return await sendEmail(getEmailConfig(token, userEmail));
};

const getEmailConfig = (token: string, email: string): EmailConfig => {
  return {
    from: EmailSender.NO_REPLY,
    to: email,
    subject: 'GM-Tool: Please verify your email',
    template: VerifyEmailTemplate({ token }),
  };
};
