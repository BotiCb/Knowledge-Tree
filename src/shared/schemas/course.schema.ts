import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ArticleModel, ArticleSchema } from './article.schema';
import { UserModel } from './user.schema';
import { CourseDifficulty, CourseTypes, CourseVisibilityStatus } from '../utils/types';
import { config } from '../config/config';

@Schema()
export class CourseModel extends Document {
  @Prop({ required: true })
  courseName: string;

  @Prop({ required: true })
  courseType: CourseTypes;

  @Prop({ type: String })
  description: string;

  @Prop({ type: [ArticleSchema], default: [] })
  articles: ArticleModel[];

  @Prop({ type: Types.ObjectId, ref: UserModel.name, required: true })
  author: UserModel;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({
    default: config.get('plain.courseIndexPhotoUrl'),
  })
  indexPhotoUrl: string;

  @Prop({ type: Number, default: 0 })
  enrolledStudents: number;

  @Prop()
  difficulty: CourseDifficulty;

  @Prop({ type: Number, default: 0 })
  price: number;

  @Prop({ default: CourseVisibilityStatus.PRIVATE })
  visibility: CourseVisibilityStatus;

  @Prop({ type: Number, default: 0 })
  duration: number;
  @Prop({ default: [] })
  views: Date[];
}

export const CourseSchema = SchemaFactory.createForClass(CourseModel);
