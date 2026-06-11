import { Injectable, Logger } from '@nestjs/common';
import {
  AfterCreate,
  AuthService,
  DatabaseHook,
} from '@thallesp/nestjs-better-auth';
import { orgSlugFromEmail } from '@/auth/utils/org-slug';
import type { Auth } from '@/auth/create-auth';

@DatabaseHook()
@Injectable()
export class UserCreateHook {
  private readonly logger = new Logger(UserCreateHook.name);

  constructor(private readonly authService: AuthService<Auth>) {}

  @AfterCreate('user')
  async afterUserCreate(user: { id: string; name: string; email: string }) {
    const organizationName = user.name?.trim()
      ? `${user.name.trim()}'s Organization`
      : 'My Organization';

    await this.authService.api.createOrganization({
      body: {
        name: organizationName,
        slug: orgSlugFromEmail(user.email),
        userId: user.id,
        keepCurrentActiveOrganization: true,
      },
    });

    this.logger.log(`Created organization for user ${user.id}`);
  }
}
