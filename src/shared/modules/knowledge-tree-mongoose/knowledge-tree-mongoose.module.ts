import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from 'src/shared/schemas/user.schema';
import { CourseModel, CourseSchema } from 'src/shared/schemas/course.schema';
import { ArticleModel, ArticleSchema } from 'src/shared/schemas/article.schema';
import { config } from 'src/shared/config/config';
import { EnrolledCourseModel, EnrolledCourseSchema } from 'src/shared/schemas/enrolled.course.schema';
import { SectionModel, SectionSchema } from 'src/shared/schemas/section.schema';

@Module({
  imports: [
    MongooseModule.forRoot(config.get('db.url')),
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema, collection: 'User2' }]),
    MongooseModule.forFeature([{ name: CourseModel.name, schema: CourseSchema, collection: 'Course2' }]),
    MongooseModule.forFeature([{ name: ArticleModel.name, schema: ArticleSchema, collection: 'Article' }]),
    MongooseModule.forFeature([{ name: EnrolledCourseModel.name, schema: EnrolledCourseSchema }]),
    MongooseModule.forFeature([{ name: SectionModel.name, schema: SectionSchema }]),
  ],
  exports: [
    MongooseModule.forRoot(config.get('db.url')),
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema, collection: 'User2' }]),
    MongooseModule.forFeature([{ name: CourseModel.name, schema: CourseSchema, collection: 'Course2' }]),
    MongooseModule.forFeature([{ name: ArticleModel.name, schema: ArticleSchema, collection: 'Article' }]),
    MongooseModule.forFeature([{ name: EnrolledCourseModel.name, schema: EnrolledCourseSchema }]),
    MongooseModule.forFeature([{ name: SectionModel.name, schema: SectionSchema }]),
  ],
})
export class KnowledgeTreeMongooseModule {}
