import { CanActivate, ExecutionContext, Injectable, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../utils/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseModel } from '../schemas/course.schema';
import { UserModel } from '../schemas/user.schema';

@Injectable()
export class EnrolledCourseGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>,
    @InjectModel(CourseModel.name) public readonly coursesModel: Model<CourseModel>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserModel = request.user;
    const course: CourseModel = request.course;
    if (user.role === Role.ADMIN) {
      return true;
    }
    if (user.role === Role.TEACHER && course.author._id.toString() === user._id.toString()) {
      return true;
    }

    if (!user.enrolledCourses.some((enrolledCourse) => enrolledCourse.courseId.toString() === course._id.toString())) {
      throw new HttpException("You're not enrolled in this course", 401);
    }

    return true;
  }
}
