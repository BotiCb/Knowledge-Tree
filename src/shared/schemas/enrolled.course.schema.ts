import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ArticleProgress } from '../utils/types';

@Schema()
export class EnrolledCourseModel extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  courseId: Types.ObjectId;
  @Prop({ type: ArticleProgress, default: [] })
  articleProgresses: ArticleProgress[];

  @Prop({ type: Date })
  enrolledAt: Date;
  @Prop({ type: Number, default: 0 })
  enrollmentCost: number;
}

export const EnrolledCourseSchema = SchemaFactory.createForClass(EnrolledCourseModel);
