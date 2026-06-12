import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { BasicAuthStrategy } from './passport/BasicStategy';
import { JwtStrategy } from './passport/JwtStrategy';
import {
  Role,
  RoleSchema,
} from '@/entities/identity/role.entity';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    MongooseModule.forFeature([
      {
        schema: RoleSchema,
        name: Role.name,
      },
    ]),
  ],
  controllers: [],
  providers: [JwtStrategy, BasicAuthStrategy],
})
export class AuthorizationModule {}
