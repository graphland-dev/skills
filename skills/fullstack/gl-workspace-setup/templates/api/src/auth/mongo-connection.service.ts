import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';

@Injectable()
export class MongoConnectionService implements OnModuleDestroy {
  private readonly clientPromise: Promise<MongoClient>;

  constructor(private readonly configService: ConfigService) {
    this.clientPromise = this.connect();
  }

  private async connect(): Promise<MongoClient> {
    const uri = this.configService.get<string>('database.uri');
    if (!uri) {
      throw new Error('MONGODB_URI is required for Better Auth');
    }

    const client = new MongoClient(uri);
    await client.connect();
    return client;
  }

  async getClient(): Promise<MongoClient> {
    return this.clientPromise;
  }

  async getDb(): Promise<Db> {
    const client = await this.getClient();
    return client.db();
  }

  async onModuleDestroy(): Promise<void> {
    const client = await this.clientPromise;
    await client.close();
  }
}
