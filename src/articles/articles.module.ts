import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { CoursesModule } from 'src/courses/courses.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [CoursesModule, SharedModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService, CoursesModule],
})
export class ArticlesModule {}
