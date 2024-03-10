import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendForgotPasswordEmail(
    email: string,
    username: string,
    resetLink: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password',
      template: './forgot-password',
      context: {
        username,
        resetLink,
      },
    });
  }
}
