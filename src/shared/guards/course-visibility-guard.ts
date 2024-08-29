import { CanActivate, ExecutionContext, Injectable, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CourseVisibilityStatus, Role } from '../utils/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseModel } from '../schemas/course.schema';
import { extractCourseObjectIdFromUrl } from '../utils/mapper';
import { UserModel } from '../schemas/user.schema';

@Injectable()
export class CourseVisibilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>,
    @InjectModel(CourseModel.name) public readonly coursesModel: Model<CourseModel>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserModel = request.user;
    const courseId = extractCourseObjectIdFromUrl(request.url);
    if (!courseId) {
      throw new HttpException('Course Id not found in url', 404);
    }
    const course = await this.coursesModel.findOne({ _id: courseId }).exec();
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    request['course'] = course;

    if (course.visibility === CourseVisibilityStatus.PUBLIC) {
      return true;
    }

    if (!user) {
      throw new HttpException('Course not public', 401);
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    if (user.role === Role.STUDENT) {
      throw new HttpException('Course not public', 401);
    }
    if (course.author._id.toString() !== user._id.toString()) {
      throw new HttpException('Course not public', 401);
    }

    return true;
  }
}
