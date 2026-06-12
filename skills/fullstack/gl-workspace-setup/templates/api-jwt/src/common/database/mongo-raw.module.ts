import { Module } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Module({
  providers: [
    {
      provide: 'MONGODB_DATABASE_CONNECTION',
      useFactory: async (): Promise<Db> => {
        try {
          const client = await MongoClient.connect(
            'mongodb://clohdkbnz004a9rjzhcueason:Zs0DzPigUN6vf3deL3CRtfj5@54.251.52.98:9001',
          );
          return client.db('dinebd-dev');
        } catch (e) {
          throw e;
        }
      },
    },
  ],
  exports: ['MONGODB_DATABASE_CONNECTION'],
})
export class MongoRawModule {}
