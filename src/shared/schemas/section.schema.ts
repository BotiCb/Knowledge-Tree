import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class SectionModel extends Document {
  @Prop({ type: String })
  title: string;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true, default: 0 })
  videoDuration: number;
  @Prop({ required: true })
  createdAt: Date;
}

export const SectionSchema = SchemaFactory.createForClass(SectionModel);
