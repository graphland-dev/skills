import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access';

export const organizationAccessControl = createAccessControl(defaultStatements);

export const organizationRoles = {
  owner: ownerAc,
  admin: adminAc,
  member: memberAc,
};
