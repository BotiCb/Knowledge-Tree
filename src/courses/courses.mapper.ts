import { Injectable } from '@nestjs/common';
import { CourseDto } from './dto/output/course.dto';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { CourseSummaryDto } from './dto/output/course-summary.dto';
import { SearchCoursesDto } from './dto/output/search-courses.dto';
import { UserModel } from 'src/shared/schemas/user.schema';
import { EnrolledCourseModel } from 'src/shared/schemas/enrolled.course.schema';
import { CourseStatisticsDto } from './dto/output/course-statistics.dto';
import { TimeValueStatistics } from 'src/shared/utils/types';

@Injectable()
export class CourseMapper {
  fromPopulatedCourseModeltoCourseDto(course: CourseModel, user: UserModel): CourseDto {
    if (!user) {
      return new CourseDto(course, false);
    }
    const index = user.enrolledCourses.findIndex(
      (enrolledCourse) => enrolledCourse.courseId.toString() === course._id.toString()
    );
    if (index === -1) {
      return new CourseDto(course, false);
    }
    const watchedSecs = this.calculateWatchedSecs(user.enrolledCourses[index], course);

    const courseProgress = Math.floor((watchedSecs / course.duration) * 100);
    return new CourseDto(course, true, courseProgress, user.enrolledCourses[index].articleProgresses);
  }

  fromPopulatedCourseModeltoCourseSummaryDto(course: CourseModel, user: UserModel): CourseSummaryDto {
    if (!user) {
      return new CourseSummaryDto(course, false);
    }
    const index = user.enrolledCourses.findIndex(
      (enrolledCourse) => enrolledCourse.courseId.toString() === course._id.toString()
    );
    if (index === -1) {
      return new CourseSummaryDto(course, false);
    }
    const watchedSecs = this.calculateWatchedSecs(user.enrolledCourses[index], course);
    const courseProgress = Math.floor((watchedSecs / course.duration) * 100);
    return new CourseSummaryDto(course, true, courseProgress);
  }

  fromPopulatedCourseModeltoSearchCoursesDto(course: CourseModel): SearchCoursesDto {
    return new SearchCoursesDto(course);
  }

  private calculateWatchedSecs(enrolledCourse: EnrolledCourseModel, course: CourseModel): number {
    let watchedSecs = 0;

    enrolledCourse.articleProgresses.forEach((currentArticle) => {
      const foundArticle = course.articles.find(
        (article) => article._id.toString() === currentArticle.articleId.toString()
      );

      if (foundArticle) {
        currentArticle.sections.forEach((currentSection) => {
          const foundSection = foundArticle.sections.find(
            (section) => section._id.toString() === currentSection.sectionId.toString()
          );

          if (foundSection) {
            watchedSecs += currentSection.watchedSecs;
          }
        });
      }
    });

    return watchedSecs;
  }

  formTimeValueStatisticsCourseStatisticDto(
    startDate: Date,
    enrollments: number,
    enrollmentStats: TimeValueStatistics[],
    views: number,
    viewsStats: TimeValueStatistics[]
  ): CourseStatisticsDto {
    const stats: {
      date: string;
      views?: number;
      enrolledStudents?: number;
    }[] = [];
    enrollmentStats.forEach((enrollmentStat) => {
      stats.push({
        date: enrollmentStat.time,
        enrolledStudents: enrollmentStat.value,
      });
    });

    viewsStats.forEach((viewStat) => {
      const index = stats.findIndex((stat) => stat.date === viewStat.time);
      if (index === -1) {
        stats.push({ date: viewStat.time, views: viewStat.value });
      } else {
        stats[index].views = viewStat.value;
      }
    });
    stats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return new CourseStatisticsDto(startDate.toISOString().split('T')[0], stats, views, enrollments);
  }
}
