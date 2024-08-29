import { CanActivate, ExecutionContext, Injectable, ForbiddenException, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../utils/types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseModel } from '../schemas/course.schema';
import { extractCourseObjectIdFromUrl } from '../utils/mapper';

@Injectable()
export class AuthorRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(CourseModel.name) public readonly coursesModel: Model<CourseModel>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const courseId = extractCourseObjectIdFromUrl(request.url);
    if (!courseId) {
      throw new HttpException('Course Id not found in url', 404);
    }
    const course = await this.coursesModel.findOne({ _id: courseId }).exec();
    if (!course) {
      throw new HttpException('Course not found', 404);
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    if (course.author._id.toString() !== user._id.toString()) {
      throw new ForbiddenException();
    }

    return true;
  }
}
