import { Controller, Post, Body, Param, Delete, HttpException, Put, Get } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/input/create-article.dto';
import { AuthorOrEnrolledRole, AuthorRole } from 'src/shared/decorators/user-roles.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { UserModel } from 'src/shared/schemas/user.schema';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { isObjectId } from 'src/shared/utils/mapper';
import { UpdateArticleDto } from './dto/input/update-article.dto';

@ApiBearerAuth()
@ApiTags('Articles')
@Controller('courses/:courseId/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @AuthorOrEnrolledRole()
  @Get(':articleId')
  async getArticleById(@Param('courseId') courseId: string, @Param('articleId') articleId: string) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }
    const article = await this.articlesService.getArticleById(courseId, articleId);
    if (!article) {
      throw new HttpException('Article not found', 404);
    }
    return this.articlesService.getArticleById(courseId, articleId);
  }

  @AuthorRole()
  @Post('/create')
  createArticle(
    @CurrentUser() user: UserModel,
    @Param('courseId') courseId: string,
    @Body() createArticleDto: CreateArticleDto
  ) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (createArticleDto.articleName == undefined || createArticleDto.articleName == '') {
      throw new HttpException('Missing required fields', 400);
    }
    return this.articlesService.create(user, courseId, createArticleDto);
  }

  @AuthorRole()
  @Delete(':articleId')
  deleteArticle(@Param('courseId') courseId: string, @Param('articleId') articleId: string) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }
    return this.articlesService.removeArticle(courseId, articleId);
  }

  @AuthorRole()
  @Put(':articleId')
  uploadVideo(
    @Param('courseId') courseId: string,
    @Param('articleId') articleId: string,
    @Body() updateArticleDto: UpdateArticleDto
  ) {
    if (!isObjectId(courseId)) {
      throw new HttpException('Invalid Course Id', 400);
    }

    if (!isObjectId(articleId)) {
      throw new HttpException('Invalid Article Id', 400);
    }
    if (Object.keys(updateArticleDto).length === 0) {
      throw new HttpException('Empty body', 400);
    }
    return this.articlesService.updateArticle(courseId, articleId, updateArticleDto);
  }
}
