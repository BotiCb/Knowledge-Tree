import { Controller, Param, Post } from '@nestjs/common';
import { AdminRole } from 'src/shared/decorators/user-roles.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel } from 'src/shared/schemas/user.schema';
import { CurrentToken } from 'src/shared/decorators/current-token.decorator';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { PopulateService } from './populate.service';

@AdminRole()
@Controller('populate')
export class PopulateController {
  @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>;
  @InjectModel(CourseModel.name) public readonly courseModel: Model<CourseModel>;
  constructor(private readonly populateService: PopulateService) {}

  @Post('courses')
  async populateCourses(@CurrentToken() adminToken: string) {
    await this.populateService.populateCourses(adminToken);
  }

  @Post('randomizeUserCreatedAtDate')
  async randomizeUserCreatedAtDate() {
    await this.populateService.randomizeUserCreatedAtDate();
  }

  @Post('populateUsers')
  async populateUsers(@CurrentToken() adminToken: string) {
    await this.populateService.populateUsers(adminToken);
  }

  @Post('RandomizeCourseDates')
  async randomizeCourseDates(@CurrentToken() adminToken: string) {
    await this.populateService.randomizeCourseDates();
  }

  @Post('populateProgress')
  async populateProgress(@CurrentToken() adminToken: string) {
    await this.populateService.populateProgress(adminToken);
  }

  @Post('everything')
  async populateEverything(@CurrentToken() adminToken: string) {
    await this.populateService.populateUsers(adminToken);
    await this.populateService.randomizeUserCreatedAtDate();
    await this.populateService.populateCourses(adminToken);
    await this.populateService.randomizeCourseDates();
    await this.populateService.enrollCourses(adminToken);
    await this.populateService.populateProgress(adminToken);
  }
}
