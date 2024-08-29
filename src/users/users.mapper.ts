import { Injectable } from '@nestjs/common';
import { UserProfileDto } from './dto/output/user-profile.dto';
import { UserModel } from '../shared/schemas/user.schema';
import { CoursesService } from 'src/courses/courses.service';
import { UserInfoDto } from './dto/output/user-info.dto';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { CourseMapper } from 'src/courses/courses.mapper';
import { AuthorProfileDto } from './dto/output/author-profile.dto';
import { DetailedUserProfileDto } from './dto/output/detailed-user-profile';
import { AdminStatisticsDto } from './dto/output/admin-statistics.dto';
import { GroupStatistics, TimeValueStatistics } from 'src/shared/utils/types';
import { TeacherStatisticsDto } from './dto/output/teacher-statistics.dto';

@Injectable()
export class UserMapper {
  constructor(
    private readonly courseService: CoursesService,
    private readonly courseMapper: CourseMapper
  ) {}

  toUserProfileDto(
    user: UserModel,
    enrolledCourses: CourseModel[],
    createdCourses: CourseModel[],
    whishlist: CourseModel[]
  ): UserProfileDto {
    const courseEnrolledSummairyDtos = enrolledCourses.map((course) => {
      return this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user);
    });

    const courseCreatedSummairyDtos = createdCourses.map((course) => {
      return this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user);
    });
    const whishlistSummairyDtos = whishlist.map((course) => {
      return this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user);
    });

    return new UserProfileDto(user, courseEnrolledSummairyDtos, courseCreatedSummairyDtos, whishlistSummairyDtos);
  }

  async toAuthorProfileDto(user: UserModel, courses: CourseModel[]): Promise<AuthorProfileDto> {
    const courseSummairyDtos = courses.map((course) => {
      return this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user);
    });

    return new AuthorProfileDto(user, courseSummairyDtos);
  }

  fromUserModelToUserInfoDto(user: UserModel): UserInfoDto {
    return new UserInfoDto(user);
  }

  toDetailedUserInfoDto(
    user: UserModel,
    enrolledCourses: CourseModel[],
    createdCourses: CourseModel[],
    whishlist: CourseModel[]
  ): DetailedUserProfileDto {
    const courseEnrolledSummairyDtos = enrolledCourses.map((course) => {
      return this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user);
    });

    const courseCreatedSummairyDtos = createdCourses.map((course) => {
      return this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user);
    });
    const whishlistSummairyDtos = whishlist.map((course) => {
      return this.courseMapper.fromPopulatedCourseModeltoCourseSummaryDto(course, user);
    });
    return new DetailedUserProfileDto(
      user,
      courseEnrolledSummairyDtos,
      courseCreatedSummairyDtos,
      whishlistSummairyDtos
    );
  }

  fromTimeValueStatisticsToAdminStatisticsDto(
    startDate: Date,
    userActivityStats: TimeValueStatistics[],
    newCoursesStats: TimeValueStatistics[],
    newUsersStats: TimeValueStatistics[],
    usersByRole: GroupStatistics[],
    coursesByType: GroupStatistics[]
  ): AdminStatisticsDto {
    const stats: {
      date: string;
      newCourses?: number;
      newUsers?: number;
      userActivities?: number;
    }[] = [];

    userActivityStats.forEach((stat) => {
      stats.push({
        date: stat.time,
        userActivities: stat.value,
      });
    });

    newCoursesStats.forEach((stat) => {
      const index = stats.findIndex((s) => s.date === stat.time);
      if (index === -1) {
        stats.push({ date: stat.time, newCourses: stat.value });
      } else {
        stats[index].newCourses = stat.value;
      }
    });

    newUsersStats.forEach((stat) => {
      const index = stats.findIndex((s) => s.date === stat.time);
      if (index === -1) {
        stats.push({ date: stat.time, newUsers: stat.value });
      } else {
        stats[index].newUsers = stat.value;
      }
    });
    stats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return new AdminStatisticsDto(startDate.toISOString().split('T')[0], stats, usersByRole, coursesByType);
  }

  fromTimeValueStatisticsToTeacherStatisticsDto(
    startDate: Date,
    totalEnrollements: number,
    enrollmentsStats: TimeValueStatistics[],
    totalEarnings: number,
    earningsStats: TimeValueStatistics[]
  ): TeacherStatisticsDto {
    const stats: {
      date: string;
      earnings?: number;
      enrollments?: number;
    }[] = [];

    earningsStats.forEach((stat) => {
      stats.push({
        date: stat.time,
        earnings: stat.value,
      });
    });

    enrollmentsStats.forEach((stat) => {
      const index = stats.findIndex((s) => s.date === stat.time);
      if (index === -1) {
        stats.push({ date: stat.time, enrollments: stat.value });
      } else {
        stats[index].enrollments = stat.value;
      }
    });
    stats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return new TeacherStatisticsDto(startDate.toISOString().split('T')[0], stats, totalEarnings, totalEnrollements);
  }
}
