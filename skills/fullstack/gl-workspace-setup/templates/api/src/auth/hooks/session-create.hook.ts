import { Injectable } from '@nestjs/common';
import {
  BeforeCreate,
  DatabaseHook,
} from '@thallesp/nestjs-better-auth';
import { MongoConnectionService } from '@/auth/mongo-connection.service';
import { AUTH_COLLECTIONS } from '@/auth/auth-collections';

@DatabaseHook()
@Injectable()
export class SessionCreateHook {
  constructor(private readonly mongoConnection: MongoConnectionService) {}

  @BeforeCreate('session')
  async beforeSessionCreate(session: {
    userId: string;
    activeOrganizationId?: string | null;
  }) {
    if (session.activeOrganizationId) {
      return { data: session };
    }

    const db = await this.mongoConnection.getDb();
    const member = await db.collection(AUTH_COLLECTIONS.member).findOne(
      { userId: session.userId },
      { sort: { createdAt: 1 } },
    );

    if (!member?.organizationId || typeof member.organizationId !== 'string') {
      return { data: session };
    }

    return {
      data: {
        ...session,
        activeOrganizationId: member.organizationId,
      },
    };
  }
}
