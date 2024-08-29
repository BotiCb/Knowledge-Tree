import {
  Controller,
  Get,
  Body,
  HttpException,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  Query,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserMapper } from './users.mapper';
import { UpdateUserDto } from './dto/input/update-user.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { AdminRole, TeacherRole, UserCourseVisibilityRole, UserRole } from 'src/shared/decorators/user-roles.decorator';
import { UserModel } from 'src/shared/schemas/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserProfileDto } from './dto/output/user-profile.dto';
import { UserInfoDto } from './dto/output/user-info.dto';
import { isObjectId } from 'src/shared/utils/mapper';
import { Role } from 'src/shared/utils/types';
import { CoursesService } from 'src/courses/courses.service';
import { AuthorProfileDto } from './dto/output/author-profile.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentCourse } from 'src/shared/decorators/current-course.decorator';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { DetailedUserProfileDto } from './dto/output/detailed-user-profile';
import { EmailService } from 'src/shared/modules/email/email.service';
import { StatisticsService } from 'src/shared/modules/statistics/statistics.service';
import { AdminStatisticsDto } from './dto/output/admin-statistics.dto';
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userMapper: UserMapper,
    private readonly coursesService: CoursesService,
    private readonly emailService: EmailService,
    private readonly statisticsService: StatisticsService
  ) {}

  @AdminRole()
  @Get()
  async getAllUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortField') sortField?: string,
    @Query('sortDirection') sortDirection?: string,
    @Query('role') role?: Role,
    @Query('pendingRole') pendingRole?: Role,
    @Query('keyword') keyword?: string
  ): Promise<UserInfoDto[]> {
    const limitNumber = parseInt(limit, 10);
    const sortValue = sortField || 'createdAt';
    const sortByDirection = sortDirection === 'desc' ? -1 : 1;
    const _offset = parseInt(offset, 10) || 0;
    const _role = Object.values(Role).includes(role) ? role : undefined;
    const _pendingRole = Object.values(Role).includes(pendingRole) ? pendingRole : pendingRole || undefined;
    const queryArgs = { role: _role, keyword, pendingRole: _pendingRole };
    return (await this.usersService.findAll(queryArgs, limitNumber, { [sortValue]: sortByDirection }, _offset)).map(
      (user) => this.userMapper.fromUserModelToUserInfoDto(user)
    );
  }

  @UserRole()
  @Get('profile')
  async getProfile(@CurrentUser() user: UserModel): Promise<UserProfileDto> {
    const enrolledCourses = await this.usersService.getEnrolledCourses(user);
    const createdCourses = await this.usersService.getCreatedCourses(user);
    const whishlist = await this.usersService.getWishlistedCourses(user);
    return this.userMapper.toUserProfileDto(user, enrolledCourses, createdCourses, whishlist);
  }

  @UserRole()
  @Put('enroll-course/:courseId')
  async enrollCourse(@CurrentUser() user: UserModel, @Param('courseId') courseId: string) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Id', 400);
    }
    return this.usersService.enrollCourse(user, courseId);
  }

  @UserRole()
  @Get('info')
  getUserInfo(@CurrentUser() user: UserModel): UserInfoDto {
    return this.userMapper.fromUserModelToUserInfoDto(user);
  }

  @Get('/author/:id/profile')
  async getTeacherProfile(@Param('id') id: string): Promise<AuthorProfileDto> {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const author = await this.usersService.findUserById(id);
    if (author == null) {
      throw new HttpException('Author not found', 404);
    }
    if (author.role != Role.TEACHER) {
      throw new HttpException('This user is not a teacher', 400);
    }
    const createdCourses = await this.coursesService.getCreatedCoursesByAuthorId(author._id.toString(), true);
    return this.userMapper.toAuthorProfileDto(author, createdCourses);
  }

  @UserCourseVisibilityRole()
  @Put('wishlist/:courseId')
  async toggleWishlist(@CurrentUser() user: UserModel, @CurrentCourse() course: CourseModel) {
    if (course.author._id.toString() === user._id.toString()) {
      throw new HttpException('You cannot wishlist your own course', 400);
    }
    if (user.enrolledCourses.some((enrolledCourse) => enrolledCourse.courseId.toString() === course._id.toString())) {
      throw new HttpException('You have already enrolled this course', 400);
    }

    return this.usersService.toggleWishlist(user, course);
  }

  @UseInterceptors(FileInterceptor('file'))
  @UserRole()
  @Put()
  async updateProfile(
    @CurrentUser() user: UserModel,
    @UploadedFile() file?: Express.Multer.File,
    @Body() dto?: UpdateUserDto
  ) {
    if (Object.keys(dto).length === 0 && file == undefined) {
      throw new HttpException('Empty body', 400);
    }

    return this.usersService.updateUser(user, dto, file);
  }

  @TeacherRole()
  @Get('/teacherStatistics')
  async getTeacherStatistics(@CurrentUser() user: UserModel, @Query('range') range?: number) {
    const startDate = this.statisticsService.getStartDate(range);
    const totalEnrollements = await this.statisticsService.getTeacherTotalEnrollments(user);
    const earningStats = await this.statisticsService.getTeacherEarningsStats(user, startDate);
    const enrollmentsStats = await this.statisticsService.getEnrollmentStats(user, startDate);
    const totalEarnings = await this.statisticsService.getTotalEarned(user);
    return this.userMapper.fromTimeValueStatisticsToTeacherStatisticsDto(
      startDate,
      totalEnrollements,
      enrollmentsStats,
      totalEarnings,
      earningStats
    );
  }

  @AdminRole()
  @Get('/teacherStatistics/:id')
  async getTeacherStatisticsAsAdmin(@Param('id') id: string, @Query('range') range?: number) {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const user = await this.usersService.findUserById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return this.getTeacherStatistics(user, range);
  }

  @AdminRole()
  @Get(':id')
  async findUserById(@Param('id') id: string): Promise<DetailedUserProfileDto> {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const user = await this.usersService.findUserById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const enrolledCourses = await this.usersService.getEnrolledCourses(user);
    const createdCourses = await this.usersService.getCreatedCourses(user);
    const whishlist = await this.usersService.getWishlistedCourses(user);

    return this.userMapper.toDetailedUserInfoDto(user, enrolledCourses, createdCourses, whishlist);
  }

  @UserRole()
  @Put('request-role/:role')
  async giveRole(@CurrentUser() user: UserModel, @Param('role') role: Role) {
    if (!Object.values(Role).includes(role)) {
      throw new HttpException('Invalid role', 400);
    }
    if (user.role === role) {
      throw new HttpException('User already has this role', 400);
    }
    user.pendingRole = role;
    await user.save();
  }

  @AdminRole()
  @Put('/:id/approve-role')
  async approveRole(@Param('id') id: string) {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const user = await this.usersService.findUserById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    return this.usersService.handleUserRoleRequest(user, true);
  }

  @AdminRole()
  @Put('/:id/refuse-role')
  async refuseRole(@Param('id') id: string) {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const user = await this.usersService.findUserById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return this.usersService.handleUserRoleRequest(user, false);
  }

  @AdminRole()
  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const user = await this.usersService.findUserById(id);
    return this.usersService.deleteUser(user);
  }

  @UseInterceptors(FileInterceptor('file'))
  @AdminRole()
  @Put('/:id')
  async updateUserAdmin(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body() dto?: UpdateUserDto
  ) {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const user = await this.usersService.findUserById(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    if (Object.keys(dto).length === 0 && file == undefined) {
      throw new HttpException('Empty body', 400);
    }
    this.usersService.updateUser(user, dto, file, true);
  }

  @AdminRole()
  @Get('statistics/admin')
  async getAdminStatistics(@Query('range') range?: number): Promise<AdminStatisticsDto> {
    if (Number.isNaN(range) || range < 0 || range > 90) {
      range = null;
    }
    const startDate = this.statisticsService.getStartDate(range);
    const getUserActivityStats = await this.statisticsService.getUserActivityStats(startDate);
    const usersByRoles = await this.statisticsService.getUsersByRoles();
    const newCoursesStats = await this.statisticsService.getNewCoursesStats(startDate);
    const getNewUsersStats = await this.statisticsService.getNewUsersStats(startDate);
    const getCoursesByType = await this.statisticsService.getCoursesByType();
    return this.userMapper.fromTimeValueStatisticsToAdminStatisticsDto(
      startDate,
      getUserActivityStats,
      newCoursesStats,
      getNewUsersStats,
      usersByRoles,
      getCoursesByType
    );
  }
}
