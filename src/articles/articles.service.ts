import { HttpException, Injectable, Param } from '@nestjs/common';
import { CreateArticleDto } from './dto/input/create-article.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CoursesService } from 'src/courses/courses.service';
import { ArticleModel } from 'src/shared/schemas/article.schema';
import { UserModel } from 'src/shared/schemas/user.schema';
import { FileUploadService } from 'src/shared/modules/file-upload/file-upload.service';
import { UpdateArticleDto } from './dto/input/update-article.dto';
import { SectionModel } from 'src/shared/schemas/section.schema';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly courseService: CoursesService,
    @InjectModel(ArticleModel.name) public readonly articleModel: Model<ArticleModel>,
    private readonly fileUploadService: FileUploadService
  ) {}

  async create(user: UserModel, @Param() courseId: string, createArticleDto: CreateArticleDto) {
    const articles = this.courseService.getArticlesByCourseId(courseId);

    const articleName = createArticleDto.articleName;
    if (await this.courseService.checkIfArticleNameExists(courseId, articleName))
      throw new HttpException('Article already exists', 400);

    const article = new this.articleModel({
      articleName: articleName,
      author: user._id,
      createdAt: new Date(),
      order: (await articles).length,
    });
    (await articles).push(article);
    this.courseService.updateArticles(courseId, await articles);

    return article._id;
  }

  async removeArticle(courseId: string, articleId: string) {
    const articles = await this.courseService.getArticlesByCourseId(courseId);
    const articleIndex = articles.findIndex((article) => article._id.toString() === articleId);
    if (articleIndex === -1) {
      throw new HttpException('Article not found', 404);
    }
    if (articles[articleIndex].sections.length > 0) {
      throw new HttpException('Article has sections, delete sections first', 400);
    }
    articles.splice(articleIndex, 1);
    for (let i = articleIndex; i < articles.length; i++) {
      articles[i].order = i;
    }

    this.courseService.updateArticles(courseId, articles);
  }

  async updateArticle(courseId: string, articleId: string, newArticle: UpdateArticleDto) {
    const article = await this.getArticleById(courseId, articleId);
    if (!article) {
      throw new HttpException('Article not found', 404);
    }
    Object.assign(article, newArticle);
    return await this.saveArticle(courseId, articleId, article);
  }

  async getArticleById(courseId: string, articleId: string): Promise<ArticleModel> {
    return await this.courseService.getArticleById(courseId, articleId);
  }

  async saveArticle(courseId: string, articleId: string, article: ArticleModel) {
    article.duration = article.sections.reduce((sum, section) => sum + section.videoDuration, 0);
    return await this.courseService.updateArticle(courseId, articleId, article);
  }
  async getSectionsByArticleId(courseId: string, articleId: string): Promise<SectionModel[]> {
    const article = await this.getArticleById(courseId, articleId);
    if (!article) {
      throw new HttpException('Article not found', 404);
    }
    return article.sections;
  }

  async getSectionById(courseId: string, articleId: string, sectionId: string): Promise<SectionModel> {
    const article = await this.getArticleById(courseId, articleId);
    if (!article) {
      throw new HttpException('Article not found', 404);
    }
    return article.sections.find((section) => section._id.toString() === sectionId);
  }

  async saveSection(courseId: string, articleId: string, sectionId: string, section: SectionModel) {
    const article = await this.getArticleById(courseId, articleId);
    if (!article) {
      throw new HttpException('Article not found', 404);
    }
    const sectionIndex = article.sections.findIndex((section) => section._id.toString() === sectionId);
    if (sectionIndex === -1) {
      throw new HttpException('Section not found', 404);
    }

    article.sections[sectionIndex] = section;
    return await this.saveArticle(courseId, articleId, article);
  }
}
