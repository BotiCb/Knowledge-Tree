import { Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { LoginRequestDto } from './dto/input/login-request.dto';
import { CreateUserDto } from './dto/input/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenDto } from './dto/output/access-token.dto';
import { stringToRole } from 'src/shared/utils/mapper';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel } from 'src/shared/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/shared/modules/email/email.service';
import { Role } from 'src/shared/utils/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>,
    private jwtService: JwtService,
    private userService: UsersService,
    private emailService: EmailService
  ) {}

  async login(loginUserDto: LoginRequestDto): Promise<AccessTokenDto> {
    const { email, password } = loginUserDto;
    const user = await this.userService.findOneByEmail(email);
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      id: user._id.toString(),
      role: stringToRole(user.role),
    };
    const token = await this.jwtService.signAsync(payload);
    user.lastLogin = new Date();
    await user.save();
    return { access_token: token, token_type: 'Bearer' };
  }

  async create(createUserDto: CreateUserDto): Promise<AccessTokenDto> {
    const { firstName, lastName, email, password } = createUserDto;

    if ((await this.userModel.findOne({ email }).exec()) !== null) {
      throw new HttpException('User already exists', 400);
    }
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const createdUser = new this.userModel({
      firstName,
      lastName,
      email,
      hashedPassword,
      createdAt: new Date(),
      role: Role.STUDENT,
    });
    const payload = {
      email: createdUser.email,
      id: createdUser._id.toString(),
      role: stringToRole(createdUser.role),
    };
    this.emailService.succesfullRegistration(createdUser);
    const token = await this.jwtService.signAsync(payload);
    createdUser.lastLogin = new Date();
    await createdUser.save();
    return {
      access_token: token,
      token_type: 'Bearer',
    };
  }
}
