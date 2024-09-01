import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { config } from '../config/config';
import { Request } from 'express';
import { UserModel } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateStatistics } from '../utils/types';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: config.get('auth.jwtSecret'),
      });
      const user = await this.userModel.findOne({ _id: payload.id }).exec();
      if (!user) {
        throw new UnauthorizedException();
      }
      request['user'] = user;
      request['token'] = token;
      if (!config.get('testMode')) {
        DateStatistics.registerAction(user.lastAction);
      }
      await user.save();
    } catch (error) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
