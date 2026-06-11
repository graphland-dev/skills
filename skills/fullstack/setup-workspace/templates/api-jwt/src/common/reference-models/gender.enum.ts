import { registerEnumType } from '@nestjs/graphql';

export enum USER_GENDER {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON-BINARY',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER NOT TO SAY',
}

registerEnumType(USER_GENDER, { name: 'USER_GENDER' });
