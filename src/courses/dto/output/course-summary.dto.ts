import { ApiProperty } from '@nestjs/swagger';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { CourseVisibilityStatus } from 'src/shared/utils/types';

export class CourseSummaryDto {
  @ApiProperty()
  isEnrolled: boolean;
  @ApiProperty()
  courseId: string;
  @ApiProperty()
  courseName: string;
  @ApiProperty()
  numberOfArticles: number;
  @ApiProperty()
  difficulty: string;
  @ApiProperty()
  fullNameOfAuthor: string;
  @ApiProperty()
  photoUrlOfAuthor: string;
  @ApiProperty()
  indexPhotoUrl: string;
  @ApiProperty()
  enrolledStudents: number;
  @ApiProperty()
  price: number;
  @ApiProperty()
  progress: number;
  @ApiProperty()
  visibility: CourseVisibilityStatus;

  constructor(course: CourseModel, isEnrolled: boolean, progress: number = null) {
    this.courseId = course._id.toString();
    this.courseName = course.courseName;
    this.numberOfArticles = course.articles.length;
    this.difficulty = course.difficulty;
    this.isEnrolled = isEnrolled;
    this.indexPhotoUrl = course.indexPhotoUrl;
    this.visibility = course.visibility;
    if (isEnrolled) {
      this.progress = progress;
    }
    this.fullNameOfAuthor = `${course.author.firstName} ${course.author.lastName}`;
    this.photoUrlOfAuthor = course.author.photoUrl;
    this.enrolledStudents = course.enrolledStudents;
    this.price = course.price;
  }
}
