import { GroupStatistics } from 'src/shared/utils/types';

export class AdminStatisticsDto {
  startDate: string;
  coursesCount: number;
  stats: {
    date: string;
    newCourses?: number;
    newUsers?: number;
    userActivities?: number;
  }[];
  usersByRole: GroupStatistics[];
  coursesByType: GroupStatistics[];
  constructor(
    startDate: string,
    stats: {
      date: string;
      newCourses?: number;
      newUsers?: number;
      userActivities?: number;
    }[],
    usersByRole: GroupStatistics[],
    coursesByType: GroupStatistics[]
  ) {
    this.startDate = startDate;
    this.stats = stats;
    this.usersByRole = usersByRole;
    this.coursesByType = coursesByType;
  }
}
