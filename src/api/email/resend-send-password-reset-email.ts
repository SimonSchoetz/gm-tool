import { PasswordResetTemplate } from '@/components/emails/templates';
import { EmailSender } from '@/enums';
import { sendEmail } from './resend-send-email';
import { EmailConfig, EmailResponse } from '@/types/api/email';

export const resendSendPasswordResetEmail = async (
  token: string,
  email: string
): Promise<EmailResponse> => {
  const emailData = getEmailConfig(token, email);
  return await sendEmail(emailData);
};

const getEmailConfig = (token: string, email: string): EmailConfig => {
  return {
    from: EmailSender.NO_REPLY,
    to: email,
    subject: 'GM-Tool: Password reset',
    template: PasswordResetTemplate({ token }),
  };
};
