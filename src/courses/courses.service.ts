import { HttpException, Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/input/create-course.dto';
import { InjectModel } from '@nestjs/mongoose';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { UserModel } from 'src/shared/schemas/user.schema';
import { ClientSession, Model, Types } from 'mongoose';
import { stringToCourseDifficulty, stringToCourseType } from 'src/shared/utils/mapper';
import { ArticleModel } from 'src/shared/schemas/article.schema';
import { FileUploadService } from 'src/shared/modules/file-upload/file-upload.service';
import { UpdateCourseDto } from './dto/input/update-course.dto';
import { CourseVisibilityStatus } from 'src/shared/utils/types';
import { EmailService } from 'src/shared/modules/email/email.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(CourseModel.name) public readonly coursesModel: Model<CourseModel>,
    @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>,
    private readonly fileUploadService: FileUploadService,
    private readonly emailService: EmailService
  ) {}

  async create(user: UserModel, createCourseDto: CreateCourseDto) {
    const { courseName, courseType } = createCourseDto;
    if (await this.coursesModel.findOne({ courseName, author: user._id }).exec()) {
      throw new HttpException('CourseName already used by this user', 400);
    }
    const createdCourse = new this.coursesModel({
      courseName,
      courseType: stringToCourseType(courseType),
      articles: [],
      author: user._id,
      createdAt: new Date(),
      difficulty: stringToCourseDifficulty(createCourseDto.difficulty),
      price: createCourseDto.price,
    });

    await createdCourse.save();
    return createdCourse._id;
  }

  async findAll(): Promise<CourseModel[]> {
    return this.coursesModel.find({ isPublished: true }).populate('author').exec();
  }

  async findCoursesByQuery(
    limit: number,
    sortOptions: {},
    queryArgs: {
      user?: UserModel;
      courseTypes?: string[];
      keyword?: string;
      enrolled?: string;
      visibility?: CourseVisibilityStatus;
    },
    offset?: number
  ): Promise<CourseModel[]> {
    const queryParams: any = {};

    if (queryArgs.visibility && Object.values(CourseVisibilityStatus).includes(queryArgs.visibility)) {
      queryParams['visibility'] = queryArgs.visibility;
    }
    if (queryArgs.courseTypes && queryArgs.courseTypes.length > 0) {
      queryParams['courseType'] = { $in: queryArgs.courseTypes.map((type) => stringToCourseType(type)) };
    }

    if (queryArgs.keyword) {
      queryParams['courseName'] = { $regex: queryArgs.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    if (queryArgs.user) {
      if (queryArgs.enrolled === 'true') {
        queryParams['_id'] = { $in: queryArgs.user.enrolledCourses.map((course) => course.courseId) };
      }
      if (queryArgs.enrolled === 'false') {
        queryParams['_id'] = { $not: { $in: queryArgs.user.enrolledCourses.map((course) => course.courseId) } };
      }
    }

    return this.coursesModel.find(queryParams).skip(offset).limit(limit).sort(sortOptions).populate('author').exec();
  }

  async findCoursesByQuerryCount(queryArgs: {
    user?: UserModel;
    courseTypes?: string[];
    keyword?: string;
    enrolled?: string;
    visibility?: CourseVisibilityStatus;
  }): Promise<number> {
    const queryParams: any = {};

    if (queryArgs.visibility && Object.values(CourseVisibilityStatus).includes(queryArgs.visibility)) {
      queryParams['visibility'] = queryArgs.visibility;
    }
    if (queryArgs.courseTypes && queryArgs.courseTypes.length > 0) {
      queryParams['courseType'] = { $in: queryArgs.courseTypes.map((type) => stringToCourseType(type)) };
    }
    if (queryArgs.keyword) {
      queryParams['courseName'] = { $regex: queryArgs.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    if (queryArgs.user) {
      if (queryArgs.enrolled === 'true') {
        queryParams['_id'] = { $in: queryArgs.user.enrolledCourses.map((course) => course.courseId) };
      }
      if (queryArgs.enrolled === 'false') {
        queryParams['_id'] = { $not: { $in: queryArgs.user.enrolledCourses.map((course) => course.courseId) } };
      }
    }

    return this.coursesModel.countDocuments(queryParams).exec();
  }

  async findAllCoursesByAuthorId(id: string) {
    return this.coursesModel
      .find({ author: new Types.ObjectId(id) })
      .populate('author')
      .exec();
  }

  async getCourseByCourseId(courseId: string, session: ClientSession = null): Promise<CourseModel> {
    return this.coursesModel.findOne({ _id: courseId }).populate('author').session(session).exec();
  }

  async checkIfArticleNameExists(courseId: string, articleName: string) {
    return this.coursesModel.findOne({ _id: courseId, articles: { $elemMatch: { articleName: articleName } } }).exec();
  }

  async removeCourse(id: string) {
    const course = await this.coursesModel.findOne({ _id: id }).exec();
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    this.fileUploadService.deleteFile(course.indexPhotoUrl);
    course.articles.forEach(async (article) => {
      article.sections.forEach(async (section) => {
        this.fileUploadService.deleteFile(section.videoUrl);
      });
    });
    return this.coursesModel.deleteOne({ _id: id }).exec();
  }

  async getArticlesByCourseId(courseId: string): Promise<ArticleModel[]> {
    const course = await this.coursesModel.findOne({ _id: courseId }).exec();
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    return course.articles;
  }

  async getArticleById(courseId: string, articleId: string): Promise<ArticleModel> {
    const articles = await this.getArticlesByCourseId(courseId);
    return articles.find((article) => article._id.toString() === articleId);
  }

  async updateArticles(courseId: string, articles: ArticleModel[]) {
    const course = await this.coursesModel.findOne({ _id: courseId }).exec();
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    this.changeCoursePublicy(courseId, CourseVisibilityStatus.PRIVATE, true);
    course.articles = articles;
    await course.save();
  }

  async updateArticle(courseId: string, articleId: string, article: ArticleModel) {
    const course = await this.coursesModel.findOne({ _id: courseId }).exec();
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    const articleIndex = course.articles.findIndex((article) => article._id.toString() === articleId);
    if (articleIndex === -1) {
      throw new HttpException('Article not found', 404);
    }
    course.articles[articleIndex] = article;
    course.duration = course.articles.reduce((acc, article) => acc + article.duration, 0);
    this.changeCoursePublicy(courseId, CourseVisibilityStatus.PRIVATE, true);
    await course.save();
  }

  async findCoursesByIds(ids: string[] | Types.ObjectId[], isPublished?: boolean): Promise<CourseModel[]> {
    const queryParams = { _id: { $in: ids } };
    if (isPublished === true) {
      queryParams['visibility'] = CourseVisibilityStatus.PUBLIC;
    }
    return await this.coursesModel.find(queryParams).populate('author').exec();
  }

  async getCreatedCoursesByAuthorId(authorId: string, onlyPublished: boolean): Promise<CourseModel[]> {
    const queryParams = { author: new Types.ObjectId(authorId) };
    if (onlyPublished) {
      queryParams['visibility'] = CourseVisibilityStatus.PUBLIC;
    }
    return await this.coursesModel.find(queryParams).populate('author').exec();
  }

  async changeCoursePublicy(
    courseId: string,
    newVisibilityState: CourseVisibilityStatus,
    isAutomated = false
  ): Promise<void> {
    const course = await this.coursesModel.findOne({ _id: courseId }).populate('author').exec();
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    if (!isAutomated && course.visibility === newVisibilityState) {
      throw new HttpException('Course is already in this state', 204);
    }
    course.visibility = newVisibilityState;
    if (newVisibilityState === CourseVisibilityStatus.PUBLIC) {
      this.emailService.coursePublished(course);
    }
    await course.save();
  }

  async updateCourse(courseId: string, updateCourseDto: UpdateCourseDto, file?: Express.Multer.File) {
    const course = await this.coursesModel.findOne({ _id: courseId }).exec();
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    Object.assign(course, updateCourseDto);
    if (file) {
      course.indexPhotoUrl = await this.uploadCourseIndexPhoto(course, file);
    }
    this.changeCoursePublicy(courseId, CourseVisibilityStatus.PRIVATE, true);
    await course.save();
  }

  async uploadCourseIndexPhoto(course: CourseModel, file: Express.Multer.File): Promise<string> {
    if (!course) {
      throw new HttpException('Course not found', 404);
    }
    const url = await this.fileUploadService.uploadCourseIndexPhoto(file, course.indexPhotoUrl);
    course.indexPhotoUrl = url;
    await course.save();
    return url;
  }
}
