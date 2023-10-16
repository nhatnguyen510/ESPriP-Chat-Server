import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { LoginStrategy } from './strategy/login.strategy';
import { LoginGuard } from './guard/login.guard';
import { RefreshTokenGuard } from './guard/refresh-token.guard';
import { RefreshTokenStrategy } from './strategy/refresh-token.strategy';

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
