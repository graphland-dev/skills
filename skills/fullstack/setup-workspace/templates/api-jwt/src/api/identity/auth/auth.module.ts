import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UserModule } from '../user/user.module';
import { TenantModule } from '../tenant/tenant.module';
import { RedisModule } from '@/common/redis/redis.module';
import { MailModule } from '@/common/mail/mail.module';

@Module({
  providers: [AuthResolver, AuthService],
  imports: [UserModule, TenantModule, RedisModule, MailModule],
  exports: [AuthService],
})
export class AuthModule {}
