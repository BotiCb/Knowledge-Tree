import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { config } from '../shared/config/config';
import { SharedModule } from 'src/shared/shared.module';
@Module({
  imports: [
    UsersModule,
    SharedModule,
    JwtModule.register({
      secret: config.get('auth.jwtSecret'),
      global: true,
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
