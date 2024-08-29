export class CourseStatisticsDto {
  startDate: string;
  stats: {
    date: string;
    views?: number;
    enrolledStudents?: number;
  }[];
  views: number;
  enrolledStudents: number;
  constructor(
    startDate: string,
    stats: {
      date: string;
      views?: number;
      enrolledStudents?: number;
    }[],
    views: number,
    enrolledStudents: number
  ) {
    this.startDate = startDate;
    this.stats = stats;
    this.views = views;
    this.enrolledStudents = enrolledStudents;
  }
}
