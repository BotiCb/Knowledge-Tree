import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseMapper } from './courses.mapper';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CoursesController],
  providers: [CoursesService, CourseMapper],
  exports: [CoursesService, CourseMapper],
})
export class CoursesModule {}
