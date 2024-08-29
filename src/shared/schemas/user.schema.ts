import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EnrolledCourseModel, EnrolledCourseSchema } from './enrolled.course.schema';
import { Role } from '../utils/types';

@Schema()
export class UserModel extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  hashedPassword: string;

  @Prop({ default: '' })
  photoUrl: string;

  @Prop()
  bio: string;

  @Prop()
  createdAt: Date;

  @Prop()
  role: Role;

  @Prop({ type: [EnrolledCourseSchema] })
  enrolledCourses: EnrolledCourseModel[];

  @Prop({ default: [] })
  wishlistedCourseIds: Types.ObjectId[];

  @Prop({ default: null })
  lastLogin: Date;

  @Prop({ default: [] })
  lastAction: Date[];

  @Prop({ default: null })
  pendingRole: Role;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
