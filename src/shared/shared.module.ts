import { Module } from '@nestjs/common';
import { KnowledgeTreeMongooseModule } from './modules/knowledge-tree-mongoose/knowledge-tree-mongoose.module';
import { EmailModule } from './modules/email/email.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { VideoModule } from './modules/video/video.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [KnowledgeTreeMongooseModule, FileUploadModule, EmailModule, VideoModule, StatisticsModule],
  exports: [KnowledgeTreeMongooseModule, FileUploadModule, EmailModule, VideoModule, StatisticsModule],
})
export class SharedModule {}
