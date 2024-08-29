export class TeacherStatisticsDto {
  startDate: string;
  totalEarnings: number;
  stats: {
    date: string;
    earnings?: number;
    enrollments?: number;
  }[] = [];
  totalEnrollements: number;
  constructor(
    startDate: string,
    stats: {
      date: string;
      earnings?: number;
      enrollments?: number;
    }[],
    totalEarnings: number,
    totalEnrollements: number
  ) {
    this.startDate = startDate;
    this.stats = stats;
    this.totalEarnings = totalEarnings;
    this.totalEnrollements = totalEnrollements;
  }
}
