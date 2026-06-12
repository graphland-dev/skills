import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Entity, EntitySchema } from './entities/entity.entity';
import { EntityController } from './entity.controller';
import { EntityRepositoryService } from './entity.repository.service';
import { EntityService } from './entity.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
  ],
  controllers: [EntityController],
  providers: [EntityService, EntityRepositoryService],
  exports: [EntityService, EntityRepositoryService],
})
export class EntityModule {}
