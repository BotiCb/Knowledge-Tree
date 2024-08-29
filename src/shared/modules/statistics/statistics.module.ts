import { Module } from '@nestjs/common';
import { KnowledgeTreeMongooseModule } from '../knowledge-tree-mongoose/knowledge-tree-mongoose.module';
import { StatisticsService } from './statistics.service';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [KnowledgeTreeMongooseModule, CacheModule.register()],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
