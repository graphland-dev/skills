import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import config from '@/config';
import {
  envValidationOptions,
  envValidationSchema,
} from '@/config/env.validation';
import { AuthorizationModule } from '@/authorization/authorization.module';
import { DatabaseModule } from '@/common/database/database.module';
import { RedisModule } from '@/common/redis/redis.module';
import { MailModule } from '@/common/mail/mail.module';
import { IdentityModule } from '@/api/identity/identity.module';
import { PermissionGuard } from '@/authorization/authenticated.decorator';
import { AppController } from '@/app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req, res }) => ({ req, res }),
    }),
    AuthorizationModule,
    DatabaseModule,
    RedisModule,
    MailModule,
    IdentityModule,
  ],
  controllers: [AppController],
  providers: [PermissionGuard],
})
export class AppModule {}
