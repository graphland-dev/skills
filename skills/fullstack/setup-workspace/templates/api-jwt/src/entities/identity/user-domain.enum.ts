import { registerEnumType } from '@nestjs/graphql';

export enum UserDomain {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  MERCHANT = 'MERCHANT',
  CUSTOMER = 'CUSTOMER',
}

registerEnumType(UserDomain, { name: 'UserDomain' });
