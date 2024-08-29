import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  articleName: string;

  constructor(articleName: string) {
    this.articleName = articleName;
  }
}
