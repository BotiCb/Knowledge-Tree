import { Controller, Post, Body, HttpException, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/input/login-request.dto';
import { CreateUserDto } from './dto/input/create-user.dto';
import { AccessTokenDto } from './dto/output/access-token.dto';
import { ApiTags } from '@nestjs/swagger';
import { AdminRole } from 'src/shared/decorators/user-roles.decorator';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() loginRequestDto: LoginRequestDto): Promise<AccessTokenDto> {
    const { email, password } = loginRequestDto;
    if (!email || !password) {
      throw new HttpException('Missing required fields or wrong dto', 400);
    }
    return this.authService.login(loginRequestDto);
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<AccessTokenDto> {
    const { firstName, lastName, email, password } = createUserDto;
    if (!firstName || !lastName || !email || !password) {
      throw new HttpException('Missing required fields or wrong dto', 400);
    }

    return this.authService.create(createUserDto);
  }

  @AdminRole()
  @Post('fillWithTestUsers')
  fillWithTestUsers(@Body() createUserDtos: CreateUserDto[]) {
    createUserDtos.forEach((createUserDto) => {
      this.register(createUserDto);
    });
  }
}
