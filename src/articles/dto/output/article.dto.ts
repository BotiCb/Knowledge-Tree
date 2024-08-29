import { ApiProperty } from '@nestjs/swagger/dist';
import { SectionDto } from 'src/section/dto/output/section.dto';
import { ArticleModel } from 'src/shared/schemas/article.schema';
import { SectionProgress } from 'src/shared/utils/types';

export class ArticleDto {
  @ApiProperty()
  articleId: string;
  @ApiProperty()
  articleName: string;
  sections: SectionDto[];
  duration: number;
  progress?: number;

  constructor(article: ArticleModel, progress?: number, sectionProgresses?: SectionProgress[]) {
    this.articleId = article._id.toString();
    if (progress) {
      this.progress = progress;
    }
    this.articleName = article.articleName;
    if (sectionProgresses) {
      this.sections = article.sections.map((section) => {
        const currentSectionProgress = sectionProgresses?.find(
          (sp) => sp.sectionId.toString() === section._id.toString()
        );
        return new SectionDto(section, Math.floor((currentSectionProgress?.watchedSecs / section.videoDuration) * 100));
      });
    } else {
      this.sections = article.sections.map((section) => new SectionDto(section));
    }
    this.duration = article.duration;
  }
}
