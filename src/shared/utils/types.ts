export enum Role {
  ADMIN = 'admin',
  STUDENT = 'student',
  TEACHER = 'teacher',
}

export enum CourseDifficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  PROFESSIONAL = 'Professional',
}

export enum CourseTypes {
  LANGAUGE = 'Language',
  PROGRAMMING = 'Programming',
  MATH = 'Math',
  ENGINEERING = 'Engineering',
  PHYSICS = 'Physics',
  CHEMISTRY = 'Chemistry',
  BIOLOGY = 'Biology',
  MUSIC = 'Music',
  PHOTOGRAPHY = 'Photography',
  ART = 'Art',
  IT_SOFTWARE = 'IT & Software',
  BUSINESS = 'Business',
  DESIGN = 'Design',
  LIFESTYLE = 'Lifestyle',
  TRAVEL = 'Travel',
  HEALTH = 'Health',
  FITNESS = 'Fitness',
  HISTORY = 'History',
  GEOGRAPHY = 'Geography',
  ECONOMY = 'Economy',
  LITERATURE = 'Literature',
  OTHER = 'Other',
}

export enum CourseVisibilityStatus {
  PUBLIC = 'Public',
  PRIVATE = 'Private',
  PENDING = 'Pending',
}

export class SectionProgress {
  sectionId: string;
  watchedSecs: number;

  constructor(sectionId: string, watchedSecs: number) {
    this.sectionId = sectionId;
    this.watchedSecs = watchedSecs;
  }
}

export class ArticleProgress {
  articleId: string;
  sections: SectionProgress[];

  constructor(articleId: string, section: SectionProgress) {
    this.articleId = articleId;
    this.sections = [section];
  }
}

export class DateStatistics {
  private static isSameDay(date1: Date, date2: Date): boolean {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return formatDate(date1) === formatDate(date2);
  }

  private static deleteOldDates(dates: Date[]): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    for (let i = dates.length - 1; i >= 0; i--) {
      if (dates[i] <= cutoffDate) {
        dates.splice(i, 1);
      }
    }
  }

  static registerAction(dates: Date[], onePerDay = true, deleteAfter = true, date: Date = new Date()): void {
    if (dates.length === 0 || !this.isSameDay(date, dates[dates.length - 1]) || !onePerDay) {
      dates.push(date);
    }

    if (deleteAfter) {
      this.deleteOldDates(dates);
    }
  }
}

export class TimeValueStatistics {
  time: string;
  value: number;
}

export class GroupStatistics {
  type: string;
  count: number;
}
