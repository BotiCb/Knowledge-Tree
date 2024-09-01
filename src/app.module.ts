import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ArticlesModule } from './articles/articles.module';
import { SectionModule } from './section/section.module';


@Module({
  imports: [UsersModule, AuthModule, CoursesModule, ArticlesModule, SectionModule],
})
export class AppModule {}
