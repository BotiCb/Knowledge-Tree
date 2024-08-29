import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CourseDifficulty, CourseTypes } from 'src/shared/utils/types';

export class CreateCourseDto {
  @IsString()
  @ApiProperty()
  courseName: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  description?: string;

  @IsEnum(CourseTypes)
  @ApiProperty()
  courseType: CourseTypes;

  @IsEnum(CourseDifficulty)
  @ApiProperty()
  difficulty: CourseDifficulty;

  @IsString()
  @ApiProperty()
  price: number | string;
}
