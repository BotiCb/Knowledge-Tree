import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../utils/types';
import { UserModel } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TeacherRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(UserModel.name) public readonly userModel: Model<UserModel>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user.role !== Role.ADMIN && user.role !== Role.TEACHER) {
      throw new ForbiddenException();
    }
    return true;
  }
}
