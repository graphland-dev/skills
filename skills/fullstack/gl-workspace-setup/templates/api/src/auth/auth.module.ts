import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { createAuthCorsMiddleware } from '@/auth/auth-cors.middleware';
import { createAuth } from '@/auth/create-auth';
import { SessionCreateHook } from '@/auth/hooks/session-create.hook';
import { UserCreateHook } from '@/auth/hooks/user-create.hook';
import { MongoConnectionService } from '@/auth/mongo-connection.service';
import { OrganizationOwnerResolverService } from '@/auth/organization-owner-resolver.service';
import { OrganizationInvitationMailService } from '@/auth/organization-invitation-mail.service';
import { MailModule } from '@/common/mail/mail.module';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MongoConnectionService, OrganizationOwnerResolverService],
  exports: [MongoConnectionService, OrganizationOwnerResolverService],
})
class MongoAuthConnectionModule {}

@Module({
  imports: [ConfigModule, MailModule],
  providers: [OrganizationInvitationMailService],
  exports: [OrganizationInvitationMailService],
})
class OrganizationInvitationMailModule {}

@Global()
@Module({
  imports: [
    MongoAuthConnectionModule,
    OrganizationInvitationMailModule,
    BetterAuthModule.forRootAsync({
      isGlobal: true,
      disableGlobalAuthGuard: true,
      imports: [
        ConfigModule,
        MongoAuthConnectionModule,
        OrganizationInvitationMailModule,
      ],
      inject: [
        ConfigService,
        MongoConnectionService,
        OrganizationInvitationMailService,
      ],
      useFactory: async (
        configService: ConfigService,
        mongoConnection: MongoConnectionService,
        organizationInvitationMail: OrganizationInvitationMailService,
      ) => {
        const secret = configService.get<string>('auth.secret');
        const baseURL = configService.get<string>('auth.url');
        const githubClientId = configService.get<string>(
          'auth.github.clientId',
        );
        const githubClientSecret = configService.get<string>(
          'auth.github.clientSecret',
        );
        const googleClientId = configService.get<string>(
          'auth.google.clientId',
        );
        const googleClientSecret = configService.get<string>(
          'auth.google.clientSecret',
        );

        if (!secret || !baseURL) {
          throw new Error(
            'BETTER_AUTH_SECRET and BETTER_AUTH_URL are required',
          );
        }

        const db = await mongoConnection.getDb();

        const trustedOrigins = configService.get<string[]>(
          'auth.trustedOrigins',
          [],
        );

        const auth = createAuth({
          db,
          secret,
          baseURL,
          trustedOrigins,
          disableCsrfCheck: configService.get<boolean>(
            'auth.disableCsrfCheck',
            true,
          ),
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
          sendOrganizationInvitationEmail: (data) =>
            organizationInvitationMail.send(data),
        });

        return {
          auth,
          middleware: createAuthCorsMiddleware(trustedOrigins),
          bodyParser: {
            json: { limit: '2mb' },
            urlencoded: { limit: '2mb', extended: true },
          },
        };
      },
    }),
  ],
  providers: [UserCreateHook, SessionCreateHook],
  exports: [MongoAuthConnectionModule, BetterAuthModule],
})
export class AuthModule {}
