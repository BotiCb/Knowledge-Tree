import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @ApiProperty()
  title: string;
}
