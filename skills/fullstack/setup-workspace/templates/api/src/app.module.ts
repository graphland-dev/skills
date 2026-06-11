import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from '@/config';
import {
  envValidationOptions,
  envValidationSchema,
} from '@/config/env.validation';
import { AuthModule } from '@/auth/auth.module';
import { AuthorizationModule } from '@/authorization/authorization.module';
import { DatabaseModule } from '@/common/database/database.module';
import { AppController } from '@/app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    AuthModule,
    AuthorizationModule,
    DatabaseModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
