import { HttpException, Injectable } from '@nestjs/common';
import { CreateSectionDto } from './dto/input/create-section.dto';
import { ArticlesService } from 'src/articles/articles.service';
import { FileUploadService } from 'src/shared/modules/file-upload/file-upload.service';
import { Model } from 'mongoose';
import { SectionModel } from 'src/shared/schemas/section.schema';
import { InjectModel } from '@nestjs/mongoose';
import { VideoService } from 'src/shared/modules/video/video.service';
import { ArticleModel } from 'src/shared/schemas/article.schema';
import { UpdateSectionDto } from './dto/input/update-section.dto';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { UserModel } from 'src/shared/schemas/user.schema';
import { ArticleProgress, SectionProgress } from 'src/shared/utils/types';

@Injectable()
export class SectionService {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly fileUploadService: FileUploadService,
    private readonly videoService: VideoService,
    @InjectModel(SectionModel.name) private readonly sectionModel: Model<SectionModel>
  ) {}

  async addSection(courseId: string, articleId: string, createSectionDto: CreateSectionDto, file: Express.Multer.File) {
    const article = await this.articlesService.getArticleById(courseId, articleId);
    if (!article) {
      throw new HttpException('Article not found', 404);
    }
    if (this.checkIfSectionNameExists(article, createSectionDto.title)) {
      throw new HttpException('Section already exists', 400);
    }
    const url = await this.fileUploadService.uploadSectionVideo(file);
    const section = new this.sectionModel({
      title: createSectionDto.title,
      videoUrl: url,
      videoDuration: await this.videoService.getVideoLengthFromFirebase(url),
      createdAt: new Date(),
    });
    article.sections.push(section);
    this.articlesService.saveArticle(courseId, articleId, article);
  }

  async getSectionById(courseId: string, articleId: string, sectionId: string) {
    const section = await this.articlesService.getSectionById(courseId, articleId, sectionId);
    if (!section) {
      throw new HttpException('Section not found', 404);
    }
    return section;
  }

  async getSectionsByArticleId(courseId: string, articleId: string) {
    const sections = await this.articlesService.getSectionsByArticleId(courseId, articleId);
    if (sections.length === 0) {
      throw new HttpException('Sections not found', 404);
    }
    return sections;
  }

  checkIfSectionNameExists(article: ArticleModel, sectionName: string): boolean {
    return article.sections.some((section) => section.title === sectionName);
  }

  async remove(courseId: string, articleId: string, sectionId: string) {
    const article = await this.articlesService.getArticleById(courseId, articleId);
    if (!article) {
      throw new HttpException('Article not found', 404);
    }
    const sectionIndex = article.sections.findIndex((section) => section._id.toString() === sectionId);
    if (sectionIndex === -1) {
      throw new HttpException('Section not found', 404);
    }
    this.fileUploadService.deleteFile(article.sections[sectionIndex].videoUrl);
    article.sections.splice(sectionIndex, 1);
    this.articlesService.saveArticle(courseId, articleId, article);
  }

  async updateSection(
    courseId: string,
    articleId: string,
    sectionId: string,
    updateSectionDto: UpdateSectionDto,
    file?: Express.Multer.File
  ) {
    const section = await this.articlesService.getSectionById(courseId, articleId, sectionId);
    if (!section) {
      throw new HttpException('Section not found', 404);
    }
    if (file) {
      const videoUrl = await this.fileUploadService.uploadSectionVideo(file, section.videoUrl);
      const videoDuration = await this.videoService.getVideoLengthFromFirebase(videoUrl);
      Object.assign(section, { videoUrl, videoDuration });
    }
    Object.assign(section, updateSectionDto);
    this.articlesService.saveSection(courseId, articleId, sectionId, section);
  }

  async updateProgress(
    user: UserModel,
    course: CourseModel,
    articleId: string,
    sectionId: string,
    watchedSecs: number
  ) {
    const section = await this.getSectionById(course._id.toString(), articleId, sectionId);
    const sectionMaxDuration = section.videoDuration;

    if (watchedSecs > sectionMaxDuration || watchedSecs < 0) {
      throw new HttpException('Invalid progress', 400);
    }
    const enrolledCourse = user.enrolledCourses.find((ec) => ec.courseId.toString() === course._id.toString());
    if (!enrolledCourse) {
      throw new HttpException('Course not found', 404);
    }

    let currentArticle = enrolledCourse.articleProgresses.find((ap) => ap.articleId.toString() === articleId);
    if (!currentArticle) {
      currentArticle = new ArticleProgress(articleId, new SectionProgress(sectionId, watchedSecs));
      enrolledCourse.articleProgresses.push(currentArticle);
    } else {
      let currentSection = currentArticle.sections.find((sp) => sp.sectionId.toString() === sectionId);
      if (!currentSection) {
        currentSection = new SectionProgress(sectionId, watchedSecs);
        currentArticle.sections.push(currentSection);
      } else {
        if (watchedSecs > currentSection.watchedSecs) {
          currentSection.watchedSecs = watchedSecs;
        }
      }
    }

    user.enrolledCourses[user.enrolledCourses.indexOf(enrolledCourse)] = enrolledCourse;

    await user.save();
  }
}
