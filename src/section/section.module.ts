import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { ArticlesModule } from 'src/articles/articles.module';
import { ArticlesService } from 'src/articles/articles.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [ArticlesModule, SharedModule],
  controllers: [SectionController],
  providers: [SectionService, ArticlesService],
})
export class SectionModule {}
