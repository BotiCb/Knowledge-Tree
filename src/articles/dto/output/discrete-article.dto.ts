import { ApiProperty } from '@nestjs/swagger/dist';

export class DiscreteArticleDto {
  @ApiProperty()
  articleId: string;
  @ApiProperty()
  articleName: string;
  constructor(articleName: string, articleId: string) {
    this.articleId = articleId;
    this.articleName = articleName;
  }
}
