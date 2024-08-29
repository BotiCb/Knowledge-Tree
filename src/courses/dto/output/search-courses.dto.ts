import { ApiProperty } from '@nestjs/swagger';
import { CourseModel } from 'src/shared/schemas/course.schema';

export class SearchCoursesDto {
  @ApiProperty()
  courseId: string;
  @ApiProperty()
  courseName: string;
  @ApiProperty()
  indexPhotoUrl: string;
  @ApiProperty()
  fullNameOfAuthor: string;

  constructor(course: CourseModel) {
    this.courseId = course._id.toString();
    this.courseName = course.courseName;
    this.indexPhotoUrl = course.indexPhotoUrl;
    this.fullNameOfAuthor = `${course.author.firstName} ${course.author.lastName}`;
  }
}
