import { UserInfoDto } from 'src/users/dto/output/user-info.dto';
import { ArticleDto } from 'src/articles/dto/output/article.dto';
import { ApiProperty } from '@nestjs/swagger';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { ArticleProgress, CourseVisibilityStatus } from 'src/shared/utils/types';
export class CourseDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseName: string;

  @ApiProperty()
  courseType: string;

  @ApiProperty()
  articles: ArticleDto[];

  @ApiProperty()
  author: UserInfoDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  indexPhotoUrl: string;

  @ApiProperty()
  enrolledStudents: number;

  @ApiProperty()
  difficulty: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  visibility: CourseVisibilityStatus;

  @ApiProperty()
  progress: number;
  @ApiProperty()
  price: number;
  @ApiProperty()
  duration: number;

  @ApiProperty()
  isEnrolled: boolean;

  constructor(
    course: CourseModel,
    isEnrolled: boolean,
    progress: number = null,
    articleProgresses: ArticleProgress[] = null
  ) {
    if (progress) {
      this.progress = progress;
    }
    this.courseId = course._id.toString();
    this.courseName = course.courseName;
    this.courseType = course.courseType;
    this.description = course.description;
    this.visibility = course.visibility;
    this.isEnrolled = isEnrolled;

    if (articleProgresses) {
      this.articles = course.articles.map((article) => {
        const currentArticle = articleProgresses?.find(
          (articleProgress) => articleProgress.articleId.toString() === article._id.toString()
        );
        if (!currentArticle) {
          return new ArticleDto(article, 0);
        }

        let watchedSecs = 0;
        currentArticle.sections.forEach((currentSection) => {
          if (
            course.articles
              .find((article) => article._id.toString() === currentArticle.articleId.toString())
              .sections.find((section) => section._id.toString() === currentSection.sectionId.toString())
          ) {
            watchedSecs += currentSection.watchedSecs;
          }
        });
        return new ArticleDto(article, Math.floor((watchedSecs / article.duration) * 100), currentArticle.sections);
      });
    } else {
      this.articles = course.articles.map((article) => new ArticleDto(article));
    }

    this.author = new UserInfoDto(course.author);
    this.createdAt = course.createdAt;
    this.indexPhotoUrl = course.indexPhotoUrl;
    this.enrolledStudents = course.enrolledStudents;
    this.difficulty = course.difficulty;
    this.price = course.price;
    this.duration = course.duration;
  }
}
