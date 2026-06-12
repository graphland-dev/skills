import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ORGANIZATION_INVITATION_TEMPLATE } from '@/common/mail/emails-templates/mail.template';
import { MailService } from '@/common/mail/mail.service';

export interface OrganizationInvitationMailData {
  id: string;
  email: string;
  role: string;
  organization: {
    name: string;
  };
  inviter: {
    user: {
      name?: string | null;
      email: string;
    };
  };
  invitation: {
    expiresAt: Date | string;
  };
}

@Injectable()
export class OrganizationInvitationMailService {
  private readonly logger = new Logger(OrganizationInvitationMailService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async send(data: OrganizationInvitationMailData): Promise<void> {
    const consoleUrl = this.configService.get<string>(
      'mail.consoleUrl',
      'http://localhost:5173',
    );
    const acceptUrl = `${consoleUrl.replace(/\/$/, '')}/accept-invitation?invitationId=${encodeURIComponent(data.id)}`;
    const inviterName =
      data.inviter.user.name?.trim() || data.inviter.user.email;
    const expiresAt = new Date(data.invitation.expiresAt).toLocaleString(
      'en-US',
      { dateStyle: 'medium', timeStyle: 'short' },
    );

    const sent = await this.mailService.sendTemplate({
      to: data.email,
      subject: `Join ${data.organization.name}`,
      template: ORGANIZATION_INVITATION_TEMPLATE,
      variables: {
        organizationName: data.organization.name,
        inviterName,
        role: data.role,
        acceptUrl,
        expiresAt,
        inviteeEmail: data.email,
      },
      text: [
        `${inviterName} invited you to join ${data.organization.name} as ${data.role}.`,
        `Accept: ${acceptUrl}`,
        `Sign in with ${data.email} before ${expiresAt}.`,
      ].join('\n\n'),
    });

    if (!sent) {
      this.logger.warn(
        `Invitation email not sent to ${data.email} (invitation ${data.id})`,
      );
    }
  }
}
