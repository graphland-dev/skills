import { Injectable, Logger } from '@nestjs/common';
import { AUTH_COLLECTIONS } from '@/auth/auth-collections';
import { MongoConnectionService } from '@/auth/mongo-connection.service';

export interface OrganizationOwner {
  userId: string;
  email: string;
  name: string | null;
  organizationName: string;
}

@Injectable()
export class OrganizationOwnerResolverService {
  private readonly logger = new Logger(OrganizationOwnerResolverService.name);

  constructor(private readonly mongoConnection: MongoConnectionService) {}

  async resolveOwner(organizationId: string): Promise<OrganizationOwner | null> {
    const db = await this.mongoConnection.getDb();

    const [organization, member] = await Promise.all([
      db.collection(AUTH_COLLECTIONS.organization).findOne({ id: organizationId }),
      db
        .collection(AUTH_COLLECTIONS.member)
        .findOne({ organizationId, role: 'owner' }, { sort: { createdAt: 1 } }),
    ]);

    if (!member || typeof member.userId !== 'string') {
      this.logger.warn(
        `No owner member found for organization ${organizationId}`,
      );
      return null;
    }

    const user = await db
      .collection(AUTH_COLLECTIONS.user)
      .findOne({ id: member.userId });

    if (!user || typeof user.email !== 'string') {
      this.logger.warn(
        `Owner user ${member.userId} not found for organization ${organizationId}`,
      );
      return null;
    }

    return {
      userId: member.userId,
      email: user.email,
      name: typeof user.name === 'string' ? user.name : null,
      organizationName:
        typeof organization?.name === 'string'
          ? organization.name
          : 'your organization',
    };
  }
}
