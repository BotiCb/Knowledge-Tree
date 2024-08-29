import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { UserModel } from 'src/shared/schemas/user.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GroupStatistics, TimeValueStatistics } from 'src/shared/utils/types';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(CourseModel.name) public readonly coursesModel: Model<CourseModel>,
    @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private async cachedStats<T>(statQuery: () => Promise<T>, cacheKey: string): Promise<T> {
    let stats = await this.cacheManager.get<T>(cacheKey);

    if (!stats) {
      console.log('querying');
      stats = await statQuery();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const today = new Date();
      const ttl = Math.floor(endOfDay.getTime() - today.getTime());

      await this.cacheManager.set(cacheKey, stats, ttl);
    } else {
      console.log('from cache');
    }

    return stats;
  }

  getStartDate(range?: number, createdAt?: Date): Date {
    const today = new Date();
    const startDate = new Date();
    if (createdAt) {
      startDate.setTime(createdAt.getTime());
    } else {
      startDate.setTime(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    if (range != null) {
      const rangeStartDate = new Date();
      rangeStartDate.setDate(today.getDate() - range);
      rangeStartDate.setHours(0, 0, 0, 0);

      if (rangeStartDate > startDate) {
        startDate.setTime(rangeStartDate.getTime());
      }
    }

    startDate.setHours(0, 0, 0, 0);
    return startDate;
  }

  async getEnrolledCoursesStats(course: CourseModel, startDate: Date): Promise<TimeValueStatistics[]> {
    const cacheKey = `enrolledCourses-${course._id}-${startDate}`;
    const statsQuery = async (): Promise<TimeValueStatistics[]> => {
      const stats = await this.userModel.aggregate([
        { $unwind: '$enrolledCourses' },
        {
          $match: {
            'enrolledCourses.courseId': course._id,
            'enrolledCourses.enrolledAt': { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledCourses.enrolledAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return stats.map((stat) => ({
        time: stat._id,
        value: stat.count,
      }));
    };

    return this.cachedStats<TimeValueStatistics[]>(statsQuery, cacheKey);
  }

  async getTeacherEarningsStats(user: UserModel, startDate: Date): Promise<TimeValueStatistics[]> {
    const cacheKey = `teacherEarnings-${user._id}-${startDate}`;
    const calculateDailyEarnings = async (): Promise<TimeValueStatistics[]> => {
      const teacherCourses = await this.coursesModel.find({ author: user._id }).select('_id').exec();
      const earningsQuery = await this.userModel.aggregate([
        { $unwind: '$enrolledCourses' },
        {
          $match: {
            'enrolledCourses.enrolledAt': { $gte: startDate },
            'enrolledCourses.courseId': { $in: teacherCourses.map((course) => course._id) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledCourses.enrolledAt' } },
            earnings: { $sum: '$enrolledCourses.enrollmentCost' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return earningsQuery.map((stat) => ({
        time: stat._id,
        value: stat.earnings,
      }));
    };

    return this.cachedStats<TimeValueStatistics[]>(calculateDailyEarnings, cacheKey);
  }

  async getUserActivityStats(startDate: Date): Promise<TimeValueStatistics[]> {
    const cacheKey = `activeUsers-${startDate}`;
    const statsQuery = async (): Promise<TimeValueStatistics[]> => {
      const stats = await this.userModel.aggregate([
        { $unwind: '$lastAction' },
        {
          $match: { lastAction: { $gte: startDate } },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastAction' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return stats.map((stat) => ({
        time: stat._id,
        value: stat.count,
      }));
    };

    return this.cachedStats<TimeValueStatistics[]>(statsQuery, cacheKey);
  }

  async getCourseViews(course: CourseModel): Promise<number> {
    const cacheKey = `course-views-${course._id}`;
    const statsQuery = async (): Promise<number> => {
      try {
        return course.views.length;
      } catch (e) {
        return 0;
      }
    };

    return this.cachedStats<number>(statsQuery, cacheKey);
  }

  async getCourseViewsStats(course: CourseModel, startDate: Date): Promise<TimeValueStatistics[]> {
    const cacheKey = `course-views-${course._id}-${startDate}`;

    const statsQuery = async (): Promise<TimeValueStatistics[]> => {
      const dayCounts: { [key: string]: number } = {};
      course.views
        .filter((date) => date >= startDate)
        .forEach((date) => {
          const dateString = date.toISOString().split('T')[0];
          if (dayCounts[dateString]) {
            dayCounts[dateString]++;
          } else {
            dayCounts[dateString] = 1;
          }
        });

      return Object.keys(dayCounts).map((date) => ({
        time: date,
        value: dayCounts[date],
      }));
    };

    return this.cachedStats<TimeValueStatistics[]>(statsQuery, cacheKey);
  }

  async getUsersByRoles(): Promise<GroupStatistics[]> {
    const cacheKey = `user-numbers-by-role`;
    const statsQuery = async (): Promise<GroupStatistics[]> => {
      const stats = await this.userModel.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return stats.map((stat) => ({
        type: stat._id,
        count: stat.count,
      }));
    };

    return this.cachedStats<GroupStatistics[]>(statsQuery, cacheKey);
  }

  async getNewCoursesStats(startDate: Date): Promise<TimeValueStatistics[]> {
    const cacheKey = `newCourses-${startDate}`;
    const statsQuery = async (): Promise<TimeValueStatistics[]> => {
      const stats = await this.coursesModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      return stats.map((stat) => ({
        time: stat._id,
        value: stat.count,
      }));
    };
    return this.cachedStats<TimeValueStatistics[]>(statsQuery, cacheKey);
  }

  async getNewUsersStats(startDate: Date): Promise<TimeValueStatistics[]> {
    const cacheKey = `newUsers-${startDate}`;
    const statsQuery = async (): Promise<TimeValueStatistics[]> => {
      const stats = await this.userModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      return stats.map((stat) => ({
        time: stat._id,
        value: stat.count,
      }));
    };
    return this.cachedStats<TimeValueStatistics[]>(statsQuery, cacheKey);
  }

  async getCoursesByType(): Promise<GroupStatistics[]> {
    const cacheKey = `course-numbers-by-type`;
    const statsQuery = async (): Promise<GroupStatistics[]> => {
      const stats = await this.coursesModel.aggregate([
        { $group: { _id: '$courseType', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      return stats.map((stat) => ({
        type: stat._id,
        count: stat.count,
      }));
    };
    return this.cachedStats<GroupStatistics[]>(statsQuery, cacheKey);
  }

  async getTeacherTotalEnrollments(user: UserModel): Promise<number> {
    const cacheKey = `teacher-total-enrollments-${user._id}`;

    const statsQuery = async (): Promise<number> => {
      const stats = await this.coursesModel.aggregate([
        { $match: { author: user._id } },
        { $group: { _id: null, totalEnrollments: { $sum: '$enrolledStudents' } } },
      ]);

      return stats[0].totalEnrollments;
    };

    return this.cachedStats<number>(statsQuery, cacheKey);
  }

  async getEnrollmentStats(user: UserModel, startDate: Date): Promise<TimeValueStatistics[]> {
    const usersCourses = await this.coursesModel.find({ author: user._id }).select('_id').exec();
    const cacheKey = `enrollments-${user._id}-${startDate}`;
    const statsQuery = async (): Promise<TimeValueStatistics[]> => {
      const stats = await this.userModel.aggregate([
        { $unwind: '$enrolledCourses' },
        {
          $match: {
            'enrolledCourses.courseId': { $in: usersCourses.map((course) => course._id) },
            'enrolledCourses.enrolledAt': { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledCourses.enrolledAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return stats.map((stat) => ({
        time: stat._id,
        value: stat.count,
      }));
    };

    return this.cachedStats<TimeValueStatistics[]>(statsQuery, cacheKey);
  }

  getTotalEarned(user: UserModel): Promise<number> {
    const cacheKey = `total-earned-${user._id}`;
    const statsQuery = async (): Promise<number> => {
      return (await this.getTeacherEarningsStats(user, user.createdAt)).reduce((acc, curr) => acc + curr.value, 0);
    };
    return this.cachedStats<number>(statsQuery, cacheKey);
  }
}
