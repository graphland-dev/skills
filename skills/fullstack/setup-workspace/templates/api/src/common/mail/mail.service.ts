import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { renderMailTemplate } from '@/common/mail/emails-templates/mail.template';

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');

    if (!host) {
      this.logger.warn('MAIL_HOST is not set — outbound email is disabled');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>('mail.port', 587),
      secure: this.configService.get<boolean>('mail.secure', false),
      requireTLS: this.configService.get<number>('mail.port', 587) === 587,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.password'),
      },
    });
  }

  isEnabled(): boolean {
    return this.transporter !== null;
  }

  getDefaultTemplateVariables(): Record<string, string> {
    return {
      consoleUrl: this.configService.get<string>(
        'mail.consoleUrl',
        'http://localhost:5173',
      ),
      supportEmail: this.configService.get<string>(
        'mail.supportEmail',
        'support@localhost',
      ),
    };
  }

  async renderTemplate(
    template: string,
    variables: Record<string, string>,
  ): Promise<string> {
    return renderMailTemplate(template, {
      ...this.getDefaultTemplateVariables(),
      ...variables,
    });
  }

  async sendTemplate(params: {
    to: string;
    subject: string;
    template: string;
    variables: Record<string, string>;
    text?: string;
  }): Promise<boolean> {
    const html = await this.renderTemplate(params.template, params.variables);
    return this.sendMail({
      to: params.to,
      subject: params.subject,
      html,
      text: params.text,
    });
  }

  async sendMail(params: SendMailParams): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Skipped email to ${params.to}: mail transport not configured`,
      );
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('mail.from'),
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      this.logger.log(`Email sent to ${params.to} (${info.messageId})`);
      return true;
    } catch (error) {
      this.logger.error(`Email to ${params.to} failed`, error);
      return false;
    }
  }
}
