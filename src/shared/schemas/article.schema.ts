import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserModel } from './user.schema';
import { SectionModel, SectionSchema } from './section.schema';

@Schema()
export class ArticleModel extends Document {
  @Prop()
  articleName: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
  @Prop({ type: Types.ObjectId, ref: UserModel.name, required: true })
  author: UserModel;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: String, default: '' })
  description?: string;

  @Prop({ type: [SectionSchema], default: [] })
  sections: SectionModel[];

  @Prop({ type: Number, default: 0 })
  duration: number;
}

export const ArticleSchema = SchemaFactory.createForClass(ArticleModel);
