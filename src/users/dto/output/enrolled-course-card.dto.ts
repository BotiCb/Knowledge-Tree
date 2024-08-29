import { CourseModel } from 'src/shared/schemas/course.schema';

export class EnrolledCourseCardDto {
  courseId: string;
  progress: number;
  courseName: string;
  numberOfArticles: number;
  difficulty: string;
  indexPhotoUrl: string;
  constructor(course: CourseModel, progress: number) {
    this.courseId = course._id.toString();
    this.progress = progress;
    this.courseName = course.courseName;
    this.numberOfArticles = course.articles.length;
    this.difficulty = course.difficulty;
    this.indexPhotoUrl = course.indexPhotoUrl;
  }
}
