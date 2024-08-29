import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SectionService } from './section.service';
import { UpdateSectionDto } from './dto/input/update-section.dto';
import { CreateSectionDto } from './dto/input/create-section.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthorOrEnrolledRole, AuthorRole } from 'src/shared/decorators/user-roles.decorator';
import { isObjectId } from 'src/shared/utils/mapper';
import { VideoService } from 'src/shared/modules/video/video.service';
import { CurrentCourse } from 'src/shared/decorators/current-course.decorator';
import { CourseModel } from 'src/shared/schemas/course.schema';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { UserModel } from 'src/shared/schemas/user.schema';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Sections')
@Controller('courses/:courseId/articles/:articleId/sections')
export class SectionController {
  constructor(
    private readonly sectionService: SectionService,
    private readonly videoService: VideoService
  ) {}
  @AuthorRole()
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Param('courseId') courseId: string,
    @Param('articleId') articleId: string,
    @Body() createSectionDto: CreateSectionDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }

    if (!createSectionDto.title == undefined || createSectionDto.title == '' || createSectionDto.title == null) {
      throw new HttpException('Title is required', 400);
    }

    if (file == undefined) {
      throw new HttpException('Video is required', 400);
    }

    return this.sectionService.addSection(courseId, articleId, createSectionDto, file);
  }

  @Get()
  findAll(@Param('courseId') courseId: string, @Param('articleId') articleId: string) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }

    return this.sectionService.getSectionsByArticleId(courseId, articleId);
  }

  @AuthorOrEnrolledRole()
  @Get(':sectionId/video')
  async getArticleVideoById(
    @Param('courseId') courseId: string,
    @Param('articleId') articleId: string,
    @Param('sectionId') sectionId: string,
    @Res() response
  ) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }

    if (!isObjectId(sectionId)) {
      throw new HttpException('Invalid Section Id', 400);
    }
    const section = await this.sectionService.getSectionById(courseId, articleId, sectionId);
    if (!section) {
      throw new HttpException('Section not found', 404);
    }

    await this.videoService.streamVideo(section.videoUrl, response);
  }

  @AuthorOrEnrolledRole()
  @Put(':sectionId/progress/:progressInSec')
  async updateProgress(
    @CurrentUser() user: UserModel,
    @CurrentCourse() course: CourseModel,
    @Param('courseId') courseId: string,
    @Param('articleId') articleId: string,
    @Param('sectionId') sectionId: string,
    @Param('progressInSec') progress: number
  ) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }

    if (!isObjectId(sectionId)) {
      throw new HttpException('Invalid Section Id', 400);
    }

    return this.sectionService.updateProgress(user, course, articleId, sectionId, progress);
  }

  @AuthorRole()
  @Delete(':sectionId')
  remove(
    @Param('courseId') courseId: string,
    @Param('articleId') articleId: string,
    @Param('sectionId') sectionId: string
  ) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }

    if (!isObjectId(sectionId)) {
      throw new HttpException('Invalid Section Id', 400);
    }
    return this.sectionService.remove(courseId, articleId, sectionId);
  }

  @Put(':sectionId')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('courseId') courseId: string,
    @Param('articleId') articleId: string,
    @Param('sectionId') sectionId: string,
    @Body() updateSectionDto?: UpdateSectionDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }

    if (!isObjectId(sectionId)) {
      throw new HttpException('Invalid Section Id', 400);
    }

    if (Object.keys(updateSectionDto).length === 0 && file == undefined) {
      throw new HttpException('Empty body', 400);
    }
    return this.sectionService.updateSection(courseId, articleId, sectionId, updateSectionDto, file);
  }
}
