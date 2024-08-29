import { SectionModel } from 'src/shared/schemas/section.schema';

export class SectionDto {
  _id: string;
  title: string;
  videoDuration: number;
  progress?: number;
  constructor(section: SectionModel, progress?: number) {
    if (progress) {
      this.progress = progress;
    }
    this._id = section._id.toString();
    this.title = section.title;
    this.videoDuration = section.videoDuration;
  }
}
