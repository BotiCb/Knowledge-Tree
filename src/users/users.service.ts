import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserModel } from '../shared/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { FileUploadService } from 'src/shared/modules/file-upload/file-upload.service';
import { CoursesService } from 'src/courses/courses.service';
import { EnrolledCourseModel } from 'src/shared/schemas/enrolled.course.schema';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { EmailService } from 'src/shared/modules/email/email.service';
import { CourseVisibilityStatus, Role } from 'src/shared/utils/types';
import { UpdateUserDto } from './dto/input/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>,
    private readonly fileUploadService: FileUploadService,
    @InjectModel(EnrolledCourseModel.name) public readonly enrolledCourseModel: Model<EnrolledCourseModel>,
    @InjectModel(CourseModel.name) public readonly CourseModel: Model<CourseModel>,
    private readonly coursesService: CoursesService,
    private emailService: EmailService
  ) {}

  async findUserById(id: string): Promise<UserModel> {
    return this.userModel.findOne({ _id: id }).populate('enrolledCourses').exec();
  }

  async findAll(
    queryArgs: { keyword?: string; role?: Role; pendingRole?: Role },
    limit: number,
    sortOptions: {},
    offset?: number
  ): Promise<UserModel[]> {
    const queryParams: any = {};

    if (queryArgs.keyword) {
      queryParams['$or'] = [
        { firstName: { $regex: queryArgs.keyword, $options: 'i' } },
        { lastName: { $regex: queryArgs.keyword, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: queryArgs.keyword,
              options: 'i',
            },
          },
        },
        { email: { $regex: queryArgs.keyword, $options: 'i' } },
      ];
    }

    if (queryArgs.role) {
      queryParams['role'] = queryArgs.role;
    }

    if (queryArgs.pendingRole) {
      queryParams['pendingRole'] = queryArgs.pendingRole;
    }

    return this.userModel.find(queryParams).sort(sortOptions).skip(offset).limit(limit).exec();
  }

  async findOneByEmail(email: string): Promise<UserModel> {
    const user: UserModel = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return user;
  }

  async updatePassword(user: UserModel, passwords: UpdateUserDto, isAdmin?: boolean) {
    if (isAdmin) {
      return await this.changePassword(user, passwords.newPassword);
    }
    if (!passwords.password || !passwords.newPassword) {
      throw new HttpException('password and newPassword are required', 400);
    }
    const isMatchWithOld = await bcrypt.compare(passwords.password, user.hashedPassword);
    if (!isMatchWithOld) {
      throw new HttpException('Invalid password', 400);
    }
    if (passwords.newPassword === passwords.password) {
      throw new HttpException('The new password must be different', 400);
    }

    return await this.changePassword(user, passwords.newPassword);
  }

  async changePassword(user: UserModel, newPassword: string) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);
    user.hashedPassword = newHashedPassword;
    await user.save();
  }

  async enrollCourse(user: UserModel, courseId: string) {
    const course = await this.coursesService.getCourseByCourseId(courseId);
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    if (course.author.toString() === user._id.toString()) {
      throw new HttpException('You cannot enroll in your own course', 400);
    }
    if (course.visibility !== CourseVisibilityStatus.PUBLIC) {
      throw new HttpException('Course not public', 401);
    }

    const alreadyEnrolled = user.enrolledCourses.some(
      (enrolledCourse) => enrolledCourse.courseId.toString() === course._id.toString()
    );
    if (alreadyEnrolled) {
      throw new HttpException('You have already enrolled in this course', 400);
    }

    user.wishlistedCourseIds = user.wishlistedCourseIds.filter((id) => id.toString() !== course._id.toString());

    course.enrolledStudents += 1;
    await course.save();

    const newEnrollment = new this.enrolledCourseModel({
      courseId: course._id,
      progress: 0,
      enrolledAt: new Date(),
      enrollmentCost: course.price,
    });

    user.enrolledCourses.push(newEnrollment);
    await user.save();

    this.emailService.succesfullEnrollment(user, course);
  }

  async getEnrolledCourses(user: UserModel): Promise<CourseModel[]> {
    const enrolledCourseIds = user.enrolledCourses.map((enrolledCourse) => enrolledCourse.courseId.toString());
    const courses = await this.coursesService.findCoursesByIds(enrolledCourseIds, true);
    return courses;
  }

  async getCreatedCourses(user: UserModel): Promise<CourseModel[]> {
    const createdCourses = await this.coursesService.getCreatedCoursesByAuthorId(user._id.toString(), false);
    return createdCourses;
  }

  async uploadProfilePicture(user: UserModel, file: Express.Multer.File): Promise<string> {
    const url = await this.fileUploadService.uploadProfilePicture(file, user.photoUrl);
    user.photoUrl = url;
    await user.save();
    return url;
  }

  async updateUser(user: UserModel, updateUserDto?: UpdateUserDto, file?: Express.Multer.File, isAdmin?: boolean) {
    if (file && file.size > 0) {
      const url = await this.fileUploadService.uploadProfilePicture(file, user.photoUrl);
      user.photoUrl = url;
    } else if (file && file.size === 0) {
      this.fileUploadService.deleteFile(user.photoUrl);
      user.photoUrl = '';
    }

    if (updateUserDto?.newPassword) {
      await this.updatePassword(user, updateUserDto, isAdmin);
    }

    // Avoid assigning password fields from DTO to the user object
    delete updateUserDto.password;
    delete updateUserDto.newPassword;

    if (updateUserDto) {
      Object.assign(user, updateUserDto);
    }

    await user.save();
  }

  async toggleWishlist(user: UserModel, course: CourseModel) {
    if (user.wishlistedCourseIds.some((id) => id.toString() === course._id.toString())) {
      user.wishlistedCourseIds = user.wishlistedCourseIds.filter((id) => id.toString() !== course._id.toString());
    } else {
      user.wishlistedCourseIds.push(new Types.ObjectId(course._id.toString()));
    }
    await user.save();
  }

  async addToWishlist(user: UserModel, course: CourseModel) {
    if (!user.wishlistedCourseIds.some((id) => id.toString() === course._id.toString())) {
      user.wishlistedCourseIds.push(new Types.ObjectId(course._id.toString()));
    }
    await user.save();
  }

  async removeFromWishlist(user: UserModel, course: CourseModel) {
    user.wishlistedCourseIds = user.wishlistedCourseIds.filter((id) => id.toString() !== course._id.toString());
    await user.save();
  }

  async getWishlistedCourses(user: UserModel): Promise<CourseModel[]> {
    const wishlistedCourseIds = user.wishlistedCourseIds;
    const courses = await this.coursesService.findCoursesByIds(wishlistedCourseIds);
    return courses;
  }

  async deleteUser(user: UserModel) {
    this.fileUploadService.deleteFile(user.photoUrl);
    this.emailService.userDeleted(user);
    await this.userModel.deleteOne({ _id: user._id }).exec();
  }

  async handleUserRoleRequest(user: UserModel, accepted: boolean) {
    if (user.pendingRole === null) {
      throw new HttpException('User has no pending role', 400);
    }
    if (accepted) {
      user.role = user.pendingRole;
      user.pendingRole = null;
      this.emailService.roleApproved(user);
    } else {
      this.emailService.roleRefused(user);
      user.pendingRole = null;
    }
    await user.save();
  }
}
