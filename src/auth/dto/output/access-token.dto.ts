import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenDto {
  @ApiProperty()
  access_token: string;
  @ApiProperty()
  token_type: string;
}
