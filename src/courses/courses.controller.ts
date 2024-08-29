import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpException,
  Query,
  UseGuards,
  UseInterceptors,
  Put,
  UploadedFile,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/input/create-course.dto';
import { CourseMapper } from './courses.mapper';
import {
  AdminRole,
  AuthorRole,
  CourseVisibilityRole,
  TeacherRole,
  UserRole,
} from 'src/shared/decorators/user-roles.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { UserModel } from 'src/shared/schemas/user.schema';
import { CourseSummaryDto } from './dto/output/course-summary.dto';
import { SearchCoursesDto } from './dto/output/search-courses.dto';
import { isObjectId } from 'src/shared/utils/mapper';
import { AlwaysAllowGuard } from 'src/shared/guards/allways-allow-guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { CourseDto } from './dto/output/course.dto';
import { CourseTypes, CourseDifficulty, CourseVisibilityStatus, Role, DateStatistics } from 'src/shared/utils/types';
import { UpdateCourseDto } from './dto/input/update-course.dto';
import { StatisticsService } from 'src/shared/modules/statistics/statistics.service';
@ApiBearerAuth()
@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly courseMapper: CourseMapper,
    private readonly statisticsService: StatisticsService
  ) {}

  @AuthorRole()
  @Get(':id/statistics')
  async getCourseStatistics(@Param('id') id: string, @Query('range') range?: number) {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const course = await this.coursesService.getCourseByCourseId(id);
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    if (Number.isNaN(range) || range < 0 || range > 90) {
      range = null;
    }
    const startDate = this.statisticsService.getStartDate(range, course.createdAt);
    const enrollementStats = await this.statisticsService.getEnrolledCoursesStats(course, startDate);
    const viewsStats = await this.statisticsService.getCourseViewsStats(course, startDate);
    const views = await this.statisticsService.getCourseViews(course);
    const enrolleds = course.enrolledStudents;

    return this.courseMapper.formTimeValueStatisticsCourseStatisticDto(
      startDate,
      enrolleds,
      enrollementStats,
      views,
      viewsStats
    );
  }

  @TeacherRole()
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  create(@CurrentUser() user: UserModel, @Body() createCourseDto: CreateCourseDto) {
    createCourseDto.price = Number(createCourseDto.price);
    if (isNaN(createCourseDto.price) || createCourseDto.price < 0) {
      throw new HttpException('Price must be a positive number', 400);
    }

    return this.coursesService.create(user, createCourseDto);
  }

  @UseGuards(AlwaysAllowGuard)
  @Get()
  async findCoursesAsCardsByQuerry(
    @CurrentUser() user?: UserModel,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sortField') sortField?: string,
    @Query('sortDirection') sortDirection?: string,
    @Query('courseType') courseType?: string,
    @Query('keyword') keyword?: string,
    @Query('enrolled') enrolled?: string,
    @Query('visibility') visibility?: CourseVisibilityStatus
  ): Promise<CourseSummaryDto[]> {
    if (!user || user.role !== Role.ADMIN) {
      visibility = CourseVisibilityStatus.PUBLIC;
    }

    const courseTypesArray = courseType ? courseType.split(',') : [];
    const queryArgs = { user, courseTypes: courseTypesArray, keyword, enrolled, visibility };
    const limitNumber = parseInt(limit, 10);
    const sortValue = sortField || 'enrolledStudents';
    const sortByDirection = sortDirection === 'desc' ? 1 : -1;
    const _offset = parseInt(offset, 10);

    const courses = await this.coursesService.findCoursesByQuery(
      limitNumber,
      { [sortValue]: sortByDirection },
      queryArgs,
      _offset
    );

    return courses.map((course) => this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user));
  }

  @UseGuards(AlwaysAllowGuard)
  @Get('/count')
  async findCoursesAsCardsByQuerryCount(
    @CurrentUser() user?: UserModel,
    @Query('courseType') courseType?: string,
    @Query('keyword') keyword?: string,
    @Query('enrolled') enrolled?: string,
    @Query('visibility') visibility?: CourseVisibilityStatus
  ): Promise<number> {
    if (!user || user.role !== Role.ADMIN) {
      visibility = CourseVisibilityStatus.PUBLIC;
    }

    const courseTypesArray = courseType ? courseType.split(',') : [];
    const queryArgs = { user, courseTypes: courseTypesArray, keyword, enrolled, visibility };
    const coursesCount = await this.coursesService.findCoursesByQuerryCount(queryArgs);

    return coursesCount;
  }

  @UseGuards(AlwaysAllowGuard)
  @Get('search/:keyword')
  async searchCourses(@CurrentUser() user: UserModel, @Param('keyword') keyword: string): Promise<SearchCoursesDto[]> {
    if (!keyword) {
      throw new HttpException('Missing keyword', 400);
    }
    const queryArgs = { keyword };
    if (!user || user.role !== Role.ADMIN) {
      queryArgs['visibility'] = CourseVisibilityStatus.PUBLIC;
    }
    return (await this.coursesService.findCoursesByQuery(10, {}, queryArgs)).map((course) =>
      this.courseMapper.fromPopulatedCourseModeltoSearchCoursesDto(course)
    );
  }

  @UserRole()
  @Get('enrolled-courses')
  async getEnrolledCourses(@CurrentUser() user: UserModel): Promise<CourseSummaryDto[]> {
    const enrolledCourseIds = user.enrolledCourses.map((enrolledCourse) => enrolledCourse.courseId.toString());
    return (await this.coursesService.findCoursesByIds(enrolledCourseIds, true)).map((course) =>
      this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user)
    );
  }
  @Get('types')
  getCourseTypes(): string[] {
    return Object.values(CourseTypes);
  }

  @Get('difficulties')
  getCourseDifficulties(): string[] {
    return Object.values(CourseDifficulty);
  }

  @Get(':id')
  @CourseVisibilityRole()
  async findOne(@Param('id') id: string, @CurrentUser() user?: UserModel): Promise<CourseDto> {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    const course = await this.coursesService.getCourseByCourseId(id);
    if (course == null) {
      throw new HttpException('Course not found', 404);
    }
    if (!user || user.role === Role.STUDENT) {
      DateStatistics.registerAction(course.views, false, false);
      course.save();
    }
    return this.courseMapper.fromPopulatedCourseModeltoCourseDto(course, user);
  }

  @AuthorRole()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    return this.coursesService.removeCourse(id);
  }

  @AdminRole()
  @Put(':id/make-public')
  async makeCoursePublic(@Param('id') courseId: string) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Id', 400);
    }
    return this.coursesService.changeCoursePublicy(courseId, CourseVisibilityStatus.PUBLIC);
  }

  @AuthorRole()
  @Put(':id/make-private')
  async makeCoursePrivate(@Param('id') courseId: string) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Id', 400);
    }
    return this.coursesService.changeCoursePublicy(courseId, CourseVisibilityStatus.PRIVATE);
  }

  @AuthorRole()
  @Put(':id/make-pending')
  async makeCoursePrending(@Param('id') courseId: string) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Id', 400);
    }
    return this.coursesService.changeCoursePublicy(courseId, CourseVisibilityStatus.PENDING);
  }

  @AuthorRole()
  @UseInterceptors(FileInterceptor('file'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto?: UpdateCourseDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (!isObjectId(id)) {
      throw new HttpException('Invalid Id', 400);
    }
    if (Object.keys(updateCourseDto).length === 0 && file == undefined) {
      throw new HttpException('Empty body', 400);
    }
    if (updateCourseDto.price) {
      updateCourseDto.price = Number(updateCourseDto.price);
      if (isNaN(updateCourseDto.price) || updateCourseDto.price < 0) {
        throw new HttpException('Price must be a positive number', 400);
      }
    }

    return this.coursesService.updateCourse(id, updateCourseDto, file);
  }
}
