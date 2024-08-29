import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserMapper } from './users.mapper';
import { SharedModule } from 'src/shared/shared.module';
import { CoursesModule } from 'src/courses/courses.module';

@Module({
  imports: [SharedModule, CoursesModule],
  controllers: [UsersController],
  providers: [UsersService, UserMapper],
  exports: [UsersService],
})
export class UsersModule {}
