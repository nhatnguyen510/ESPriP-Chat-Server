import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy, LoginStrategy, RefreshTokenStrategy } from './strategy';
import { JwtAuthGuard, LoginGuard, RefreshTokenGuard } from './guard';

@Module({
  imports: [UserModule, JwtModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    LoginStrategy,
    LoginGuard,
    RefreshTokenGuard,
    RefreshTokenStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
